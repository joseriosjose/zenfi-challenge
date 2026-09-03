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

/** Por que un movimiento no entra en los totales. `null` = si entra. */
export type Exclusion = { regla: ReglaId; motivo: string };

export type Movimiento = {
  /** El registro tal como lo mando el banco. Nunca se muta. */
  original: MovimientoCrudo;
  id: string;
  fecha: Date;
  descripcion: string;
  comercio: string;
  centavos: Centavos;
  categoria: Categoria;
  origenCategoria: OrigenCategoria;
  tipo: TipoMovimiento;
  cuenta: string | null;
  estado: string;
  /** El otro extremo de un par reembolso/cargo. */
  ligadoA: string | null;
  exclusion: Exclusion | null;
};

export type AjustesUsuario = {
  /** id -> categoria elegida por el usuario. */
  categorias: Record<string, Categoria>;
  /** id -> true para forzar la inclusion de algo que una regla excluyo. */
  incluir: Record<string, boolean>;
};

export const AJUSTES_VACIOS: AjustesUsuario = { categorias: {}, incluir: {} };

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
): { categoria: Categoria; origen: OrigenCategoria } {
  const delBanco = categoriaDelBanco(crudo);
  const lider = mayoria(consenso.get(comercio));
  const deCatalogo = categoriaDeCatalogo(comercio);

  // 1. Consenso: es evidencia del propio archivo, gana sobre todo.
  if (lider !== null && lider.votos >= 2) {
    const votosPropios = delBanco === null ? 0 : (consenso.get(comercio)?.get(delBanco) ?? 0);
    if (delBanco === null || (lider.categoria !== delBanco && votosPropios <= 1)) {
      return { categoria: lider.categoria, origen: 'consenso' };
    }
    return { categoria: delBanco, origen: 'banco' };
  }

  // 2. Catalogo: corrige comercios que aparecen una sola vez y que por tanto
  //    no tienen consenso posible. Pisa al banco, pero queda marcado como
  //    'catalogo' para que la UI lo presente como sugerencia, no como hecho.
  if (deCatalogo !== null && deCatalogo !== delBanco) {
    return { categoria: deCatalogo, origen: 'catalogo' };
  }

  if (delBanco !== null) return { categoria: delBanco, origen: 'banco' };

  return { categoria: SIN_CATEGORIA, origen: 'sin-match' };
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
      m.exclusion = { regla: 'R06', motivo: 'Posible cargo repetido' };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                           */
/* ------------------------------------------------------------------ */

/** Primera exclusion que aplique, en el orden del pipeline. */
function calcularExclusion(m: Movimiento, periodo: string): Exclusion | null {
  if (m.tipo === 'traspaso') return { regla: 'R04a', motivo: 'Traspaso entre tus cuentas' };
  // Se compara la fecha local del banco, no el Date, para no cruzar husos.
  if (!m.original.fecha.startsWith(periodo)) return { regla: 'R07', motivo: 'De otro periodo' };
  if (!estaConfirmado(m.estado)) {
    const motivo = m.estado === 'en_disputa' ? 'En disputa' : 'Pendiente de confirmar';
    return { regla: 'R08', motivo };
  }
  if (m.original.moneda !== MONEDA_BASE) return { regla: 'R09', motivo: 'Falta tipo de cambio' };
  return null;
}

/**
 * Aplica el pipeline completo. Funcion pura: los ajustes entran como
 * parametro, no como estado interno, asi que el paso 10 es el ultimo map.
 */
export function derivar(ajustes: AjustesUsuario = AJUSTES_VACIOS): Periodo {
  const extracto = leerExtracto();
  const consenso = construirConsenso(extracto.movimientos);

  const movimientos: Movimiento[] = [];
  const descartados: Descarte[] = [...extracto.descartados];

  extracto.movimientos.forEach((crudo, indice) => {
    const centavos = aplicarSigno(crudo); // R01 + R02
    if (centavos === null) {
      descartados.push({ indice, id: crudo.id, motivo: 'monto no parseable' });
      return;
    }
    const comercio = comercioRaiz(crudo.descripcion);
    const { categoria, origen } = resolverCategoria(crudo, comercio, consenso); // R03

    movimientos.push({
      original: crudo,
      id: crudo.id,
      fecha: new Date(crudo.fecha),
      descripcion: crudo.descripcion,
      comercio,
      centavos,
      categoria,
      origenCategoria: origen,
      tipo: clasificarTipo(crudo, centavos, categoria), // R04
      cuenta: crudo.cuenta,
      estado: crudo.estado,
      ligadoA: null,
      exclusion: null,
    });
  });

  ligarReembolsos(movimientos); // R05

  for (const m of movimientos) {
    m.exclusion = calcularExclusion(m, extracto.periodo); // R04a, R07, R08, R09
  }
  marcarDuplicados(movimientos); // R06

  // Paso 10 — el usuario gana sobre cualquier regla anterior.
  for (const m of movimientos) {
    const elegida = ajustes.categorias[m.id];
    if (elegida !== undefined) {
      m.categoria = elegida;
      m.origenCategoria = 'usuario';
    }
    if (ajustes.incluir[m.id] === true) m.exclusion = null;
  }

  return {
    periodo: extracto.periodo,
    generadoEn: extracto.generadoEn,
    movimientos,
    descartados,
  };
}
