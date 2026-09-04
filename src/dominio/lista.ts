/**
 * Filtrado, agrupacion y totales de la lista de movimientos.
 *
 * Contar, sumar y agrupar son operaciones de negocio aunque se vean en un
 * encabezado: la pantalla llama, no calcula.
 */
import type { Categoria, Centavos } from './modelo';
import type { Movimiento } from './derivar';
import { normalizarTexto } from './reglas';

export type Filtros = {
  categorias: Categoria[];
  /** `null` representa el movimiento sin cuenta atribuida. */
  cuentas: (string | null)[];
  /** Busqueda por concepto. */
  texto: string;
};

export const SIN_FILTROS: Filtros = { categorias: [], cuentas: [], texto: '' };

export function filtrosActivos(filtros: Filtros): number {
  return (
    filtros.categorias.length +
    filtros.cuentas.length +
    (filtros.texto.trim() === '' ? 0 : 1)
  );
}

export function filtrar(movimientos: Movimiento[], filtros: Filtros): Movimiento[] {
  const busqueda = normalizarTexto(filtros.texto);
  return movimientos.filter((m) => {
    if (filtros.categorias.length > 0 && !filtros.categorias.includes(m.categoria)) return false;
    if (filtros.cuentas.length > 0 && !filtros.cuentas.includes(m.cuenta)) return false;
    if (busqueda !== '' && !normalizarTexto(m.descripcion).includes(busqueda)) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* Opciones del panel de filtros                                      */
/* ------------------------------------------------------------------ */

export type OpcionCategoria = { categoria: Categoria; movimientos: number };
export type OpcionCuenta = { cuenta: string | null; movimientos: number };

/**
 * Las opciones salen de los datos en alcance, no de una lista fija: asi
 * ninguna categoria se queda fuera del panel y los conteos nunca mienten.
 */
export function opcionesDeFiltro(movimientos: Movimiento[]): {
  categorias: OpcionCategoria[];
  cuentas: OpcionCuenta[];
} {
  const porCategoria = new Map<Categoria, number>();
  const porCuenta = new Map<string | null, number>();

  for (const m of movimientos) {
    porCategoria.set(m.categoria, (porCategoria.get(m.categoria) ?? 0) + 1);
    porCuenta.set(m.cuenta, (porCuenta.get(m.cuenta) ?? 0) + 1);
  }

  return {
    categorias: [...porCategoria.entries()]
      .map(([categoria, movimientos_]) => ({ categoria, movimientos: movimientos_ }))
      .sort((a, b) => b.movimientos - a.movimientos),
    cuentas: [...porCuenta.entries()]
      .map(([cuenta, movimientos_]) => ({ cuenta, movimientos: movimientos_ }))
      .sort((a, b) => b.movimientos - a.movimientos),
  };
}

/* ------------------------------------------------------------------ */
/* Totales y agrupacion                                               */
/* ------------------------------------------------------------------ */

export type TotalesDeLista = {
  movimientos: number;
  /** Solo suma lo que cuenta: los excluidos se ven, pero no mueven el total. */
  gastoCentavos: Centavos;
};

function esGasto(m: Movimiento): boolean {
  return m.exclusion === null && (m.tipo === 'gasto' || m.tipo === 'reembolso');
}

export function totalizar(movimientos: Movimiento[]): TotalesDeLista {
  return {
    movimientos: movimientos.length,
    gastoCentavos: -movimientos.filter(esGasto).reduce((total, m) => total + m.centavos, 0),
  };
}

export type GrupoDelDia = {
  /** `YYYY-MM-DD` en hora local del banco. */
  dia: string;
  /** Solo suma lo que cuenta: un cargo en disputa no mueve el total del dia. */
  centavos: Centavos;
  movimientos: Movimiento[];
};

/**
 * El dia se toma del texto ISO original, no del `Date`, por la misma razon que
 * R07: la fecha que importa es la local del banco, no la del navegador.
 */
function diaDe(m: Movimiento): string {
  return m.original.fecha.slice(0, 10);
}

export function agruparPorDia(movimientos: Movimiento[]): GrupoDelDia[] {
  const grupos = new Map<string, Movimiento[]>();
  for (const m of movimientos) {
    const dia = diaDe(m);
    grupos.set(dia, [...(grupos.get(dia) ?? []), m]);
  }

  return [...grupos.entries()]
    .map(([dia, delDia]) => ({
      dia,
      centavos: delDia.filter(esGasto).reduce((total, m) => total + m.centavos, 0),
      movimientos: [...delDia].sort((a, b) => b.original.fecha.localeCompare(a.original.fecha)),
    }))
    .sort((a, b) => b.dia.localeCompare(a.dia));
}
