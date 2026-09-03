/**
 * Agregados del periodo. Contar, sumar y sacar porcentajes son operaciones de
 * negocio aunque se muestren en un encabezado: la pantalla llama, no calcula.
 */
import type { Categoria, Centavos } from './modelo';
import type { Movimiento, Periodo } from './derivar';

export type GastoPorCategoria = {
  categoria: Categoria;
  centavos: Centavos;
  /** Porcentaje del gasto total, 0-100. Solo para presentacion. */
  pct: number;
  movimientos: number;
  /** Reembolsos ya descontados de esta categoria. */
  reembolsadoCentavos: Centavos;
};

export type Resumen = {
  gastoCentavos: Centavos;
  ingresoCentavos: Centavos;
  balanceCentavos: Centavos;
  porCategoria: GastoPorCategoria[];
  incluidos: Movimiento[];
  /** Los que una regla dejo fuera. Se muestran, con su motivo. */
  excluidos: Movimiento[];
};

/**
 * Un reembolso no se presenta como ingreso: se resta del gasto de su propia
 * categoria. El usuario nunca compro de mas, asi que el reporte no debe
 * decir que lo hizo. El balance del mes es identico en las dos
 * presentaciones; lo que cambia es que la neta no infla gasto ni ingreso.
 */
function cuentaComoGasto(m: Movimiento): boolean {
  return m.tipo === 'gasto' || m.tipo === 'reembolso';
}

export function resumir(periodo: Periodo): Resumen {
  const incluidos = periodo.movimientos.filter((m) => m.exclusion === null);
  const excluidos = periodo.movimientos.filter((m) => m.exclusion !== null);

  const gastoCentavos = -incluidos
    .filter(cuentaComoGasto)
    .reduce((total, m) => total + m.centavos, 0);

  const ingresoCentavos = incluidos
    .filter((m) => m.tipo === 'ingreso')
    .reduce((total, m) => total + m.centavos, 0);

  const acumulado = new Map<Categoria, { centavos: Centavos; movimientos: number; reembolsado: Centavos }>();
  for (const m of incluidos.filter(cuentaComoGasto)) {
    const previo = acumulado.get(m.categoria) ?? { centavos: 0, movimientos: 0, reembolsado: 0 };
    acumulado.set(m.categoria, {
      centavos: previo.centavos - m.centavos,
      movimientos: previo.movimientos + 1,
      reembolsado: previo.reembolsado + (m.tipo === 'reembolso' ? m.centavos : 0),
    });
  }

  const porCategoria = [...acumulado.entries()]
    .map(([categoria, dato]) => ({
      categoria,
      centavos: dato.centavos,
      pct: gastoCentavos === 0 ? 0 : (dato.centavos / gastoCentavos) * 100,
      movimientos: dato.movimientos,
      reembolsadoCentavos: dato.reembolsado,
    }))
    .sort((a, b) => b.centavos - a.centavos);

  return {
    gastoCentavos,
    ingresoCentavos,
    balanceCentavos: ingresoCentavos - gastoCentavos,
    porCategoria,
    incluidos,
    excluidos,
  };
}
