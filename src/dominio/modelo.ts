/**
 * Vocabulario del dominio y el registro tal como lo manda el banco.
 *
 * `MovimientoCrudo` es deliberadamente permisivo: refleja el payload real,
 * con sus `null`, sus cadenas vacias y sus montos en texto. No se corrige
 * aqui. Las reglas producen valores derivados que viven junto al original,
 * nunca en lugar de el.
 */

/** El registro original, intacto. Es lo que se muestra en "como lo envio tu banco". */
export type MovimientoCrudo = {
  id: string;
  /** ISO 8601 con offset, como llega. La conversion a Date la hacen las reglas. */
  fecha: string;
  descripcion: string;
  /** El agregador manda number casi siempre y string a veces (R01). */
  monto: number | string;
  /** Texto libre del origen; no se cierra a un enum para no perder registros. */
  moneda: string;
  /** `null` y `''` son la misma ausencia expresada de dos formas. */
  categoria: string | null;
  /** `null` en cargos que el banco no logro atribuir a una cuenta. */
  cuenta: string | null;
  estado: string;
};

/* ------------------------------------------------------------------ */
/* Vocabularios cerrados                                              */
/* ------------------------------------------------------------------ */

/**
 * Categorias que la app conoce. Es la lista que ve el usuario al corregir un
 * movimiento, asi que esta cerrada a proposito: una categoria que no se puede
 * elegir no sirve de nada.
 */
export const CATEGORIAS = [
  'Comida',
  'Comisiones',
  'Compras',
  'Efectivo',
  'Entretenimiento',
  'Ingresos',
  'Pagos',
  'Salud',
  'Seguros',
  'Servicios',
  'Supermercado',
  'Suscripciones',
  'Transferencias',
  'Transporte',
  'Viajes',
  'Vivienda',
  'Sin categoría',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const SIN_CATEGORIA: Categoria = 'Sin categoría';

export function esCategoria(valor: unknown): valor is Categoria {
  return typeof valor === 'string' && CATEGORIAS.some((c) => c === valor);
}

/** Los unicos estados en los que el dinero ya se movio en firme. */
export function estaConfirmado(estado: string): boolean {
  return estado === 'confirmada';
}

export const MONEDA_BASE = 'MXN';

/* ------------------------------------------------------------------ */
/* Dinero                                                             */
/* ------------------------------------------------------------------ */

/**
 * Los importes viven como enteros de centavos, no como float.
 *
 * No es teorico: sumando el periodo en float el balance sale
 * -62580.149999999994 en vez de -62580.15. Con centavos sale exacto, y sin
 * meter una dependencia de decimales.
 */
export type Centavos = number;

/** R01 — parseo de monto. Devuelve `null` si el valor no es un importe. */
export function aCentavos(monto: number | string): Centavos | null {
  if (typeof monto === 'string' && monto.trim() === '') return null;
  const valor = typeof monto === 'number' ? monto : Number(monto.trim());
  if (!Number.isFinite(valor)) return null;
  return Math.round(valor * 100);
}

const FORMATOS = new Map<string, Intl.NumberFormat>(
  ['MXN', 'USD'].map((currency) => [
    currency,
    new Intl.NumberFormat('es-MX', { style: 'currency', currency }),
  ]),
);

/**
 * Formatear es operacion de dominio, no de presentacion: evita que un
 * `.toFixed(2)` se cuele dentro de un componente.
 *
 * Una moneda que no conocemos se escribe con su codigo en vez de disfrazarse
 * de pesos. Es el mismo criterio que R09: sin tipo de cambio no se convierte.
 */
export function formatearMonto(centavos: Centavos, moneda: string): string {
  // `-0 === 0` es true, asi que esto normaliza el cero negativo que sale de
  // negar una suma vacia y que Intl formatea como "-$0.00".
  const valor = centavos === 0 ? 0 : centavos / 100;
  const formato = FORMATOS.get(moneda);
  return formato === undefined ? `${valor.toFixed(2)} ${moneda}` : formato.format(valor);
}

export function formatearMXN(centavos: Centavos): string {
  return formatearMonto(centavos, MONEDA_BASE);
}
