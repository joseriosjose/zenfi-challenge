/**
 * Conciliacion: agrupa lo que quedo fuera de los totales por *que puede hacer
 * el usuario al respecto*, no por regla.
 *
 * Un traspaso, un duplicado y un cargo pendiente estan fuera por razones
 * distintas: el primero es correcto para siempre, el segundo espera una
 * decision y el tercero espera al banco. Mezclarlos en una lista de siete
 * renglones obliga a leerlos uno por uno para saber si hay algo que hacer.
 */
import { MONEDA_BASE } from './modelo';
import type { Centavos } from './modelo';
import type { Exclusion, Movimiento, Periodo, ReglaExclusion } from './derivar';

export type FamiliaId =
  /** Nada que decidir: o nunca fue un gasto, o el usuario ya lo confirmo. */
  | 'resuelto'
  /** El sistema no tiene la informacion; el usuario si. */
  | 'decision'
  /** Falta que el banco lo resuelva. El tiempo lo mueve, no el usuario. */
  | 'todavia-no';

/** Un mapa, en un archivo. Total por construccion: `ReglaExclusion` es cerrado. */
const FAMILIA_POR_REGLA: Record<ReglaExclusion, FamiliaId> = {
  R04a: 'resuelto',
  R06: 'decision',
  R09: 'decision',
  R08: 'todavia-no',
};

/**
 * La familia no sale solo de la regla: una duda que el usuario ya resolvio
 * deja de ser una duda, aunque el importe siga fuera del total.
 */
function familiaDe(movimiento: Movimiento, regla: ReglaExclusion): FamiliaId {
  return movimiento.exclusionConfirmada ? 'resuelto' : FAMILIA_POR_REGLA[regla];
}

/** El orden en que se presentan: de lo resuelto a lo que espera. */
const ORDEN: readonly FamiliaId[] = ['resuelto', 'decision', 'todavia-no'] as const;

/** Un total por moneda. Sin tipo de cambio no se suman entre si (R09). */
export type Suma = { moneda: string; centavos: Centavos };

/**
 * Un movimiento excluido con su motivo ya separado del `| null`. La pantalla
 * recibe la exclusion como un hecho y no vuelve a preguntar si existe.
 */
export type Renglon = {
  movimiento: Movimiento;
  exclusion: Exclusion;
};

export type Grupo = {
  id: FamiliaId;
  renglones: Renglon[];
  /** Base primero; el resto en el orden en que aparecio. */
  sumas: Suma[];
};

export type Conciliacion = {
  /** Solo las familias con al menos un movimiento. */
  grupos: Grupo[];
  movimientos: number;
  sumas: Suma[];
};

/** Importes en positivo: la pantalla habla de cuanto quedo fuera, no del signo. */
function sumar(renglones: Renglon[]): Suma[] {
  const total = new Map<string, Centavos>();
  for (const { movimiento } of renglones) {
    const moneda = movimiento.original.moneda;
    total.set(moneda, (total.get(moneda) ?? 0) + Math.abs(movimiento.centavos));
  }
  return [...total.entries()]
    .map(([moneda, centavos]) => ({ moneda, centavos }))
    .sort((a, b) => Number(b.moneda === MONEDA_BASE) - Number(a.moneda === MONEDA_BASE));
}

export function conciliar(periodo: Periodo): Conciliacion {
  // `flatMap` con un arreglo vacio filtra y estrecha en el mismo paso: de
  // aqui en adelante `exclusion` es un valor, no un `| null` por revisar.
  const renglones: Renglon[] = periodo.movimientos.flatMap((movimiento) =>
    movimiento.exclusion === null
      ? []
      : [{ movimiento, exclusion: movimiento.exclusion }],
  );

  const grupos = ORDEN.map((id) => {
    const miembros = renglones.filter((r) => familiaDe(r.movimiento, r.exclusion.regla) === id);
    return { id, renglones: miembros, sumas: sumar(miembros) };
  }).filter((grupo) => grupo.renglones.length > 0);

  return { grupos, movimientos: renglones.length, sumas: sumar(renglones) };
}
