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
    // Una categoria que suma cero no es parte del desglose: no esconde dinero
    // y solo agrega un renglon de $0.00 (el caso de txn_036).
    .filter(([, dato]) => dato.centavos !== 0)
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

/**
 * La frase que responde "en que se te fue el dinero" sin que el usuario tenga
 * que leer el desglose. Es criterio de negocio, no de presentacion: decidir
 * que "mas de la mitad" merece decirse y "3%" no, es una regla.
 */
export function titularDelMes(resumen: Resumen): string | null {
  const mayor = resumen.porCategoria[0];
  if (mayor === undefined || mayor.centavos <= 0) return null;
  if (resumen.porCategoria.length === 1) return `Todo tu gasto del mes fue en ${mayor.categoria}`;
  if (mayor.pct >= 90) return `Casi todo se te fue en ${mayor.categoria}`;
  if (mayor.pct >= 50) return `Más de la mitad se te fue en ${mayor.categoria}`;
  if (mayor.pct >= 33) return `Un tercio se te fue en ${mayor.categoria}`;
  if (mayor.pct >= 20) return `Lo que más pesó fue ${mayor.categoria}`;
  return 'Tu gasto quedó bastante repartido este mes';
}

export type Otras = {
  centavos: Centavos;
  pct: number;
  /** Cuantas categorias quedaron colapsadas aqui. */
  categorias: number;
};

/** Corta el desglose en las `limite` mayores y colapsa el resto en "Otras". */
export function agruparOtras(
  porCategoria: GastoPorCategoria[],
  limite: number,
): { principales: GastoPorCategoria[]; otras: Otras | null } {
  const principales = porCategoria.slice(0, limite);
  const resto = porCategoria.slice(limite);
  if (resto.length === 0) return { principales, otras: null };

  return {
    principales,
    otras: {
      centavos: resto.reduce((total, c) => total + c.centavos, 0),
      pct: resto.reduce((total, c) => total + c.pct, 0),
      categorias: resto.length,
    },
  };
}

/** Los mas recientes primero. El orden del archivo no es cronologico. */
export function masRecientes(movimientos: Movimiento[], limite: number): Movimiento[] {
  return [...movimientos]
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, limite);
}
