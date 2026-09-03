/**
 * La unica puerta al archivo de datos (regla 1 de docs/ARQUITECTURA.md).
 * Ningun otro modulo importa movimientos.json; todos reciben el resultado.
 *
 * Valida estructura, no vocabulario: descarta solo registros rotos de verdad.
 * Un `estado` o una `moneda` que no conozcamos NO tumba el movimiento —
 * eso lo deciden las reglas, que pueden dejarlo visible y fuera de totales.
 */
import datosJson from '../data/movimientos.json';
import { aCentavos } from './modelo';
import type { MovimientoCrudo } from './modelo';

/** El JSON se toma como desconocido: su tipo inferido describe este archivo, no el feed. */
const fuente: unknown = datosJson;

export type Descarte = {
  /** Posicion en el arreglo original, para poder rastrearlo. */
  indice: number;
  id: string | null;
  motivo: string;
};

export type Extracto = {
  /** Periodo declarado por el emisor, formato `YYYY-MM`. */
  periodo: string;
  generadoEn: Date;
  movimientos: MovimientoCrudo[];
  /** Registros que no pasaron. Se cuentan y se reportan, nunca se pierden en silencio. */
  descartados: Descarte[];
};

type Validacion =
  | { ok: true; movimiento: MovimientoCrudo }
  | { ok: false; motivo: string };

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function esFechaValida(valor: string): boolean {
  return !Number.isNaN(new Date(valor).getTime());
}

function validarMovimiento(bruto: unknown): Validacion {
  if (!esObjeto(bruto)) return { ok: false, motivo: 'el registro no es un objeto' };

  const { id, fecha, descripcion, monto, moneda, categoria, cuenta, estado } = bruto;

  if (typeof id !== 'string' || id === '') return { ok: false, motivo: 'id ausente' };
  if (typeof fecha !== 'string' || !esFechaValida(fecha)) {
    return { ok: false, motivo: 'fecha ausente o no parseable' };
  }
  if (typeof descripcion !== 'string') return { ok: false, motivo: 'descripcion ausente' };
  if (typeof monto !== 'number' && typeof monto !== 'string') {
    return { ok: false, motivo: 'monto no es numero ni texto' };
  }
  if (aCentavos(monto) === null) {
    return { ok: false, motivo: `monto no representa un importe: ${JSON.stringify(monto)}` };
  }
  if (typeof moneda !== 'string' || moneda === '') return { ok: false, motivo: 'moneda ausente' };
  if (typeof estado !== 'string' || estado === '') return { ok: false, motivo: 'estado ausente' };
  if (categoria !== null && typeof categoria !== 'string') {
    return { ok: false, motivo: 'categoria no es texto ni null' };
  }
  if (cuenta !== null && typeof cuenta !== 'string') {
    return { ok: false, motivo: 'cuenta no es texto ni null' };
  }

  return {
    ok: true,
    movimiento: { id, fecha, descripcion, monto, moneda, categoria, cuenta, estado },
  };
}

/**
 * Lee el extracto completo. Funcion pura: mismo archivo, mismo resultado.
 *
 * Lanza solo si el sobre esta roto (sin periodo o sin arreglo de movimientos),
 * porque en ese caso no hay nada que mostrar y es un error de build, no una
 * condicion de runtime que el usuario pueda resolver.
 */
export function leerExtracto(): Extracto {
  if (!esObjeto(fuente)) throw new Error('movimientos.json: la raiz no es un objeto');

  const { periodo, generado_en: generadoEn, movimientos } = fuente;

  if (typeof periodo !== 'string') throw new Error('movimientos.json: falta "periodo"');
  if (typeof generadoEn !== 'string' || !esFechaValida(generadoEn)) {
    throw new Error('movimientos.json: "generado_en" ausente o no parseable');
  }
  if (!Array.isArray(movimientos)) throw new Error('movimientos.json: "movimientos" no es arreglo');

  const validos: MovimientoCrudo[] = [];
  const descartados: Descarte[] = [];

  movimientos.forEach((bruto: unknown, indice) => {
    const resultado = validarMovimiento(bruto);
    if (resultado.ok) {
      validos.push(resultado.movimiento);
    } else {
      const id = esObjeto(bruto) && typeof bruto.id === 'string' ? bruto.id : null;
      descartados.push({ indice, id, motivo: resultado.motivo });
    }
  });

  return { periodo, generadoEn: new Date(generadoEn), movimientos: validos, descartados };
}
