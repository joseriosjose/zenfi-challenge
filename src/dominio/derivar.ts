/**
 * Derivacion contextual y orquestacion del pipeline.
 *
 * Lo de aqui NO se puede calcular desde un movimiento aislado: necesita el
 * conjunto completo, el periodo o los ajustes del usuario. Es la razon por la
 * que un componente no puede resolverlo solo — no tiene los insumos.
 *
 * Orden de ejecucion (cambiarlo cambia los totales):
 *   R01 monto -> R02 signo -> R03 categoria -> R04 tipo -> R05 reembolsos
 *   -> R06 duplicados -> R07 periodo -> R08 estado -> R09 moneda
 *   -> ajustes del usuario, que ganan sobre todo lo anterior.
 */
import { MONEDA_BASE, SIN_CATEGORIA, estaConfirmado } from './modelo';
import type { Categoria, Centavos, MovimientoCrudo } from './modelo';
import {
  aplicarSigno,
  categoriaDeCatalogo,
  categoriaDelBanco,
  clasificarTipo,
  comercioRaiz,
} from './reglas';
import type { OrigenCategoria, ReglaId, TipoMovimiento } from './reglas';
import { leerExtracto } from './parsear';
import type { Descarte } from './parsear';

/**
 * Las unicas reglas que sacan algo de los totales. El resto del pipeline
 * repara, clasifica o define alcance, pero nunca excluye: dejarlas fuera del
 * tipo evita mapas con entradas que no pueden ocurrir.
 */
export type ReglaExclusion = Extract<ReglaId, 'R04a' | 'R06' | 'R08' | 'R09'>;

/**
 * Por que un movimiento no entra en los totales. `null` = si entra.
 *
 * El texto vive aqui y no en la pantalla porque depende de datos que solo el
 * dominio interpreta —el `estado` que manda el banco, por ejemplo—. Repetir
 * ese vocabulario en la UI seria mantener la misma regla en dos lugares.
 */
export type Exclusion = {
  regla: ReglaExclusion;
  /** Etiqueta corta. Cabe en un renglon de lista. */
  motivo: string;
  /** Una frase que explica el motivo sin citar la regla. */
  detalle: string;
};

export type Movimiento = {
  /** El registro tal como lo mando el banco. Nunca se muta. */
  original: MovimientoCrudo;
  id: string;
  fecha: Date;
  /** El nombre que se muestra: el alias del usuario si lo puso, si no el del banco. */
  descripcion: string;
  /**
   * Raiz del comercio segun la descripcion del BANCO, no el alias. Renombrar
   * un movimiento no puede reagrupar el consenso: seria dejar que el usuario
   * mueva sin querer la categoria de otros cargos.
   */
  comercio: string;
  /** Anotacion libre del usuario. Nada la lee: es para el. */
  nota: string | null;
  /** `true` si el importe ya esta en moneda base gracias a un TC del usuario. */
  convertido: boolean;
  /** El usuario ya reviso su exclusion y la dio por buena. */
  exclusionConfirmada: boolean;
  centavos: Centavos;
  categoria: Categoria;
  origenCategoria: OrigenCategoria;
  /**
   * La categoria que mando el banco, si la reconocemos. `null` cuando vino
   * vacia o con un nombre que no existe. Se guarda para poder mostrar que se
   * cambio y para poder deshacerlo.
   */
  categoriaBanco: Categoria | null;
  /**
   * Cuantos cargos del mismo comercio respaldan la categoria. Solo tiene
   * sentido con `origenCategoria: 'consenso'`; en el resto es 0.
   */
  apoyos: number;
  tipo: TipoMovimiento;
  cuenta: string | null;
  estado: string;
  /** El otro extremo de un par reembolso/cargo. */
  ligadoA: string | null;
  exclusion: Exclusion | null;
  /**
   * Lo que las reglas decidieron ANTES de aplicar las correcciones. Sirve para
   * saber si un valor que el usuario mando de vuelta es de verdad una
   * correccion o es lo mismo que ya habiamos calculado: guardar sin cambiar
   * nada no debe marcar el movimiento como corregido.
   */
  segunReglas: { categoria: Categoria; centavos: Centavos; tipo: TipoMovimiento };
};

/**
 * Lo que el usuario corrigio de UN movimiento. Todo `null` significa "no lo
 * toque": el pipeline decide. Es la unica entrada de escritura de la app.
 *
 * Un objeto por movimiento y no un `Record` por campo porque las correcciones
 * se guardan, se muestran y se descartan juntas: "restaurar lo que envio el
 * banco" es borrar esta llave, no recorrer seis diccionarios.
 */
export type AjusteMovimiento = {
  /** Alias para reconocerlo. No cambia el agrupamiento por comercio. */
  nombre: string | null;
  nota: string | null;
  categoria: Categoria | null;
  /** Importe corregido, con signo. Pisa lo que mando el banco. */
  centavos: Centavos | null;
  tipo: TipoMovimiento | null;
  /** Pesos por unidad de la moneda extranjera. Resuelve R09. */
  tipoCambio: number | null;
  /** Fuerza la inclusion de algo que una regla dejo fuera. */
  incluir: boolean;
  /**
   * El usuario reviso la exclusion y esta de acuerdo. No mueve ningun total
   * —el movimiento ya estaba fuera—, pero deja de pedirle una decision. Un
   * grupo que se llama "necesitan tu decision" y solo acepta una de las dos
   * respuestas sigue preguntando para siempre.
   */
  confirmado: boolean;
};

export const AJUSTE_VACIO: AjusteMovimiento = {
  nombre: null,
  nota: null,
  categoria: null,
  centavos: null,
  tipo: null,
  tipoCambio: null,
  incluir: false,
  confirmado: false,
};

/** id del movimiento -> lo que el usuario le corrigio. */
export type AjustesUsuario = Record<string, AjusteMovimiento>;

export const AJUSTES_VACIOS: AjustesUsuario = {};

/** Si esta llave no aporta nada, no vale la pena guardarla. */
export function ajusteVacio(ajuste: AjusteMovimiento): boolean {
  return (
    ajuste.nombre === null &&
    ajuste.nota === null &&
    ajuste.categoria === null &&
    ajuste.centavos === null &&
    ajuste.tipo === null &&
    ajuste.tipoCambio === null &&
    !ajuste.incluir &&
    !ajuste.confirmado
  );
}

export type Periodo = {
  periodo: string;
  generadoEn: Date;
  movimientos: Movimiento[];
  descartados: Descarte[];
};

const VENTANA_REEMBOLSO_MS = 90 * 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* R03 — consenso de categoria por comercio                           */
/* ------------------------------------------------------------------ */

type Consenso = Map<string, Map<Categoria, number>>;

function construirConsenso(crudos: MovimientoCrudo[]): Consenso {
  const consenso: Consenso = new Map();
  for (const crudo of crudos) {
    const categoria = categoriaDelBanco(crudo);
    if (categoria === null) continue;
    const comercio = comercioRaiz(crudo.descripcion);
    const conteo = consenso.get(comercio) ?? new Map<Categoria, number>();
    conteo.set(categoria, (conteo.get(categoria) ?? 0) + 1);
    consenso.set(comercio, conteo);
  }
  return consenso;
}

/** La categoria con mas cargos del comercio, si le gana estrictamente al resto. */
function mayoria(conteo: Map<Categoria, number> | undefined): { categoria: Categoria; votos: number } | null {
  if (conteo === undefined) return null;
  let lider: { categoria: Categoria; votos: number } | null = null;
  let empatada = false;
  for (const [categoria, votos] of conteo) {
    if (lider === null || votos > lider.votos) {
      lider = { categoria, votos };
      empatada = false;
    } else if (votos === lider.votos) {
      empatada = true;
    }
  }
  return lider !== null && !empatada ? lider : null;
}

/**
 * R03 — resuelve la categoria.
 *
 * Prioridad: consenso del propio archivo > catalogo escrito a mano > sin match.
 * El consenso solo pisa al banco cuando el banco esta en minoria (un cargo
 * suelto contra dos o mas del mismo comercio); nunca cuando hay empate.
 */
function resolverCategoria(
  crudo: MovimientoCrudo,
  comercio: string,
  consenso: Consenso,
): { categoria: Categoria; origen: OrigenCategoria; apoyos: number } {
  const delBanco = categoriaDelBanco(crudo);
  const lider = mayoria(consenso.get(comercio));
  const deCatalogo = categoriaDeCatalogo(comercio);

  // 1. Consenso: es evidencia del propio archivo, gana sobre todo.
  if (lider !== null && lider.votos >= 2) {
    const votosPropios = delBanco === null ? 0 : (consenso.get(comercio)?.get(delBanco) ?? 0);
    if (delBanco === null || (lider.categoria !== delBanco && votosPropios <= 1)) {
      return { categoria: lider.categoria, origen: 'consenso', apoyos: lider.votos };
    }
    return { categoria: delBanco, origen: 'banco', apoyos: 0 };
  }

  // 2. Catalogo: corrige comercios que aparecen una sola vez y que por tanto
  //    no tienen consenso posible. Pisa al banco, pero queda marcado como
  //    'catalogo' para que la UI lo presente como sugerencia, no como hecho.
  if (deCatalogo !== null && deCatalogo !== delBanco) {
    return { categoria: deCatalogo, origen: 'catalogo', apoyos: 0 };
  }

  if (delBanco !== null) return { categoria: delBanco, origen: 'banco', apoyos: 0 };

  return { categoria: SIN_CATEGORIA, origen: 'sin-match', apoyos: 0 };
}

/* ------------------------------------------------------------------ */
/* R05 — ligado de reembolsos                                         */
/* ------------------------------------------------------------------ */

/**
 * Liga cada reembolso con su cargo original: mismo comercio raiz, mismo
 * importe absoluto, y el reembolso posterior al cargo dentro de 90 dias.
 *
 * Las tres condiciones a la vez. Reembolsos parciales quedan fuera a
 * proposito: ligar por monto parcial produce falsos positivos.
 */
function ligarReembolsos(movimientos: Movimiento[]): void {
  const reembolsos = movimientos.filter((m) => m.tipo === 'reembolso');
  for (const reembolso of reembolsos) {
    const cargo = movimientos.find(
      (m) =>
        m.tipo === 'gasto' &&
        m.comercio === reembolso.comercio &&
        Math.abs(m.centavos) === Math.abs(reembolso.centavos) &&
        m.fecha.getTime() < reembolso.fecha.getTime() &&
        reembolso.fecha.getTime() - m.fecha.getTime() <= VENTANA_REEMBOLSO_MS,
    );
    if (cargo === undefined) continue;
    reembolso.ligadoA = cargo.id;
    cargo.ligadoA = reembolso.id;
    reembolso.categoria = cargo.categoria;
  }
}

/* ------------------------------------------------------------------ */
/* R06 — duplicados                                                   */
/* ------------------------------------------------------------------ */

/** Mismo comercio, mismo importe absoluto y misma fecha-hora exacta. Gana `confirmada`. */
function marcarDuplicados(movimientos: Movimiento[]): void {
  const grupos = new Map<string, Movimiento[]>();
  for (const m of movimientos) {
    const clave = `${m.comercio}|${Math.abs(m.centavos)}|${m.original.fecha}`;
    grupos.set(clave, [...(grupos.get(clave) ?? []), m]);
  }

  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue;
    const conservado = grupo.find((m) => estaConfirmado(m.estado)) ?? grupo[0];
    for (const m of grupo) {
      if (m === conservado || m.exclusion !== null) continue;
      m.exclusion = {
        regla: 'R06',
        motivo: 'Posible cargo repetido',
        // La clave del grupo incluye la fecha-hora exacta, asi que el gemelo
        // siempre cae en el mismo instante: la frase no necesita formatearla.
        detalle: 'Hay otro cargo idéntico el mismo día y a la misma hora.',
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                           */
/* ------------------------------------------------------------------ */

/**
 * R07 — alcance del periodo. Se compara la fecha local del banco, no el Date,
 * para no cruzar husos horarios.
 *
 * No es una exclusion: un cargo de agosto no esta "excluido del calculo de
 * septiembre", simplemente no es de septiembre. Sale del alcance y se revisa
 * en su propio mes.
 */
function enPeriodo(crudo: MovimientoCrudo, periodo: string): boolean {
  return crudo.fecha.startsWith(periodo);
}

/**
 * Primera exclusion que aplique, en el orden del pipeline. Solo corre sobre
 * movimientos que ya pertenecen al mes: excluir es "es de este mes pero no
 * cuenta", no "es de otro mes".
 */
function calcularExclusion(m: Movimiento): Exclusion | null {
  if (m.tipo === 'traspaso') {
    return {
      regla: 'R04a',
      motivo: 'Traspaso entre tus cuentas',
      detalle:
        'Moviste dinero entre cuentas tuyas. Los consumos de esa tarjeta ya están contados uno por uno.',
    };
  }
  if (!estaConfirmado(m.estado)) {
    if (m.estado === 'en_disputa') {
      return {
        regla: 'R08',
        motivo: 'En disputa',
        detalle: 'Está en disputa con tu banco.',
      };
    }
    if (m.estado === 'programada') {
      return {
        regla: 'R08',
        motivo: 'Programado, todavía no se cobra',
        detalle: 'Está agendado para una fecha futura. El dinero todavía no sale.',
      };
    }
    return {
      regla: 'R08',
      motivo: 'Pendiente de confirmar',
      detalle: 'Tu banco todavía no confirma este cargo.',
    };
  }
  if (m.original.moneda !== MONEDA_BASE && !m.convertido) {
    return {
      regla: 'R09',
      motivo: 'Falta tipo de cambio',
      detalle: `Llegó en ${m.original.moneda} y tu banco no envió a cuánto estaba ese día.`,
    };
  }
  return null;
}

export type MesDisponible = {
  /** Formato `YYYY-MM`. */
  periodo: string;
  movimientos: number;
};

export type Calendario = {
  /** El periodo que declara el emisor del archivo. */
  declarado: string;
  /** Solo los meses que la data realmente tiene, del mas reciente al mas viejo. */
  meses: MesDisponible[];
};

/**
 * Que meses se pueden consultar. No es el rango del periodo declarado: el
 * archivo trae movimientos de otros meses, y esos tambien se pueden revisar.
 */
export function calendario(): Calendario {
  const extracto = leerExtracto();
  const conteo = new Map<string, number>();
  for (const crudo of extracto.movimientos) {
    const mes = crudo.fecha.slice(0, 7);
    conteo.set(mes, (conteo.get(mes) ?? 0) + 1);
  }
  const meses = [...conteo.entries()]
    .map(([periodo, movimientos]) => ({ periodo, movimientos }))
    .sort((a, b) => b.periodo.localeCompare(a.periodo));

  return { declarado: extracto.periodo, meses };
}

/**
 * R09 — sin tipo de cambio no se convierte. Con uno, si: el usuario aporto el
 * dato que al banco le falto. El resultado queda en centavos de la moneda
 * base, y a partir de ahi el movimiento es uno mas.
 */
function convertir(centavos: Centavos, crudo: MovimientoCrudo, tipoCambio: number | null): Centavos {
  if (crudo.moneda === MONEDA_BASE || tipoCambio === null || tipoCambio <= 0) return centavos;
  return Math.round(centavos * tipoCambio);
}

/**
 * Aplica el pipeline completo. Funcion pura: el periodo y los ajustes entran
 * como parametros, asi que cambiar de mes recalcula todo sin estado oculto.
 */
export function derivar(ajustes: AjustesUsuario, periodoElegido: string): Periodo {
  const extracto = leerExtracto();
  const consenso = construirConsenso(extracto.movimientos);

  const movimientos: Movimiento[] = [];
  const descartados: Descarte[] = [...extracto.descartados];

  // El consenso de categoria se construye con TODO el archivo (arriba), pero
  // el pipeline solo corre sobre los movimientos del mes elegido: mas cargos
  // del mismo comercio en otros meses siguen siendo evidencia valida.
  extracto.movimientos.forEach((crudo, indice) => {
    if (!enPeriodo(crudo, periodoElegido)) return; // R07 — alcance
    const delBanco = aplicarSigno(crudo); // R01 + R02
    if (delBanco === null) {
      descartados.push({ indice, id: crudo.id, motivo: 'monto no parseable' });
      return;
    }
    const ajuste = ajustes[crudo.id] ?? AJUSTE_VACIO;

    // El importe corregido entra ANTES de clasificar y de excluir: cambiar el
    // monto puede volver un cargo un abono, y eso cambia el tipo. Si se
    // aplicara al final, el tipo quedaria describiendo un importe que ya no
    // existe.
    // El tipo de cambio no es una correccion sino un dato que al banco le
    // falto, asi que entra en la linea base y no en la capa del usuario.
    const reglaCentavos = convertir(delBanco, crudo, ajuste.tipoCambio);
    const centavos = ajuste.centavos ?? reglaCentavos;

    const comercio = comercioRaiz(crudo.descripcion);
    const regla = resolverCategoria(crudo, comercio, consenso); // R03
    const categoria = ajuste.categoria ?? regla.categoria;

    movimientos.push({
      original: crudo,
      id: crudo.id,
      fecha: new Date(crudo.fecha),
      descripcion: ajuste.nombre ?? crudo.descripcion,
      comercio,
      nota: ajuste.nota,
      convertido: crudo.moneda !== MONEDA_BASE && ajuste.tipoCambio !== null,
      exclusionConfirmada: ajuste.confirmado,
      centavos,
      categoria,
      origenCategoria: ajuste.categoria === null ? regla.origen : 'usuario',
      categoriaBanco: categoriaDelBanco(crudo),
      apoyos: regla.apoyos,
      tipo: ajuste.tipo ?? clasificarTipo(crudo, centavos, categoria), // R04
      cuenta: crudo.cuenta,
      estado: crudo.estado,
      ligadoA: null,
      exclusion: null,
      segunReglas: {
        categoria: regla.categoria,
        centavos: reglaCentavos,
        tipo: clasificarTipo(crudo, reglaCentavos, regla.categoria),
      },
    });
  });

  ligarReembolsos(movimientos); // R05

  for (const m of movimientos) {
    m.exclusion = calcularExclusion(m); // R04a, R08, R09
  }
  marcarDuplicados(movimientos); // R06

  // Ultimo paso — incluir a mano gana sobre cualquier exclusion.
  for (const m of movimientos) {
    if (ajustes[m.id]?.incluir !== true) continue;
    m.exclusion = null;
    // Un traspaso que el usuario mete a mano deja de ser traspaso: esta
    // diciendo que ese dinero si salio de su bolsillo. Sin esto la exclusion
    // desaparece de la lista pero el total no se mueve, que es justo la clase
    // de mentira que estas pantallas existen para evitar.
    if (m.tipo === 'traspaso') m.tipo = m.centavos > 0 ? 'ingreso' : 'gasto';
  }

  return {
    periodo: periodoElegido,
    generadoEn: extracto.generadoEn,
    movimientos,
    descartados,
  };
}
