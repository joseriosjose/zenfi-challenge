/**
 * Normalizacion pura: f(registro) -> valor.
 *
 * Todo lo de aqui depende unicamente del registro que recibe. Determinista y
 * sin estado. Lo que necesita el conjunto completo (consenso de categoria,
 * duplicados, reembolsos) vive en derivar.ts, porque no se puede resolver
 * desde un movimiento aislado.
 */
import { SIN_CATEGORIA, aCentavos, esCategoria } from './modelo';
import type { Categoria, Centavos, MovimientoCrudo } from './modelo';

export type ReglaId =
  | 'R01' | 'R02' | 'R03' | 'R04a' | 'R04b'
  | 'R05' | 'R06' | 'R07' | 'R08' | 'R09';

export type TipoMovimiento = 'gasto' | 'ingreso' | 'traspaso' | 'reembolso';

/** De donde salio la categoria. La UI trata distinto la evidencia y la suposicion. */
export type OrigenCategoria =
  /** La mando el banco y es consistente. */
  | 'banco'
  /** La dedujimos de los otros cargos del mismo comercio: hay evidencia en el archivo. */
  | 'consenso'
  /** La pusimos nosotros a mano. Es conocimiento inyectado, no evidencia. */
  | 'catalogo'
  /** La corrigio el usuario. Gana sobre cualquier regla. */
  | 'usuario'
  /** No hay forma de saberla y no la inventamos. */
  | 'sin-match';

const PREFIJOS_REEMBOLSO = ['REEMBOLSO', 'DEVOLUCION', 'REVERSO'];

function sinAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizarTexto(texto: string): string {
  return sinAcentos(texto).toUpperCase().trim();
}

/**
 * Comercio raiz: lo que permite reconocer que dos descripciones son el mismo
 * negocio. `AMAZON MX MARKETPLACE` y `REEMBOLSO AMAZON MX` -> `AMAZON MX`.
 *
 * Quita el prefijo de reembolso y los codigos de operacion (tokens que mezclan
 * letras y digitos, como `P2A34F`), y se queda con las dos primeras palabras.
 */
export function comercioRaiz(descripcion: string): string {
  const tokens = normalizarTexto(descripcion)
    .split(/\s+/)
    .filter((token) => token !== '');

  const primero = tokens[0];
  const sinPrefijo =
    primero !== undefined && PREFIJOS_REEMBOLSO.includes(primero) ? tokens.slice(1) : tokens;

  const esCodigoDeOperacion = (token: string) => /\d/.test(token) && /[A-Z]/.test(token);
  const utiles = sinPrefijo.filter((token) => !esCodigoDeOperacion(token));
  const base = utiles.length > 0 ? utiles : sinPrefijo;

  return base.slice(0, 2).join(' ');
}

/** R05 (parte pura) — la descripcion se anuncia como devolucion. */
export function pareceReembolso(descripcion: string): boolean {
  const texto = normalizarTexto(descripcion);
  return PREFIJOS_REEMBOLSO.some((prefijo) => texto.startsWith(prefijo));
}

/**
 * R02 — signo.
 *
 * Un positivo solo es dinero que entra si el banco lo categorizo como ingreso
 * o si se anuncia como devolucion. Cualquier otro positivo (un supermercado,
 * un seguro) es un cargo con el signo invertido en el origen.
 *
 * Deuda conocida: depende de texto libre del banco. La solucion real es que el
 * origen mande un campo de tipo de operacion.
 */
export function aplicarSigno(crudo: MovimientoCrudo): Centavos | null {
  const centavos = aCentavos(crudo.monto);
  if (centavos === null) return null;
  if (centavos <= 0) return centavos;

  const esIngreso = crudo.categoria === 'Ingresos' || pareceReembolso(crudo.descripcion);
  return esIngreso ? centavos : -centavos;
}

/**
 * R03 (parte pura) — catalogo de comercios.
 *
 * Conocimiento escrito a mano, Solo cubre comercios
 * que aparecen una sola vez y que por tanto no tienen consenso posible; 42 de
 * 49 comercios del dataset aparecen una vez, asi que esto nunca generaliza.
 * Por eso la UI distingue `catalogo` de `consenso`.
 */
const CATALOGO_COMERCIOS: ReadonlyArray<readonly [string, Categoria]> = [
  ['SPOTIFY', 'Suscripciones'],
  ['FARMACIAS GUADALAJARA', 'Salud'],
];

export function categoriaDeCatalogo(comercio: string): Categoria | null {
  const entrada = CATALOGO_COMERCIOS.find(([clave]) => comercio.startsWith(clave));
  return entrada === undefined ? null : entrada[1];
}

/** La categoria que mando el banco, si es una que conocemos. `''` y `null` son la misma ausencia. */
export function categoriaDelBanco(crudo: MovimientoCrudo): Categoria | null {
  if (crudo.categoria === null || crudo.categoria.trim() === '') return null;
  return esCategoria(crudo.categoria) ? crudo.categoria : null;
}

/** R04a — pago a una tarjeta propia. Sus consumos ya estan en el archivo uno por uno. */
export function esTraspasoInterno(descripcion: string): boolean {
  const texto = normalizarTexto(descripcion);
  return texto.startsWith('PAGO TARJETA') || texto.startsWith('PAGO TDC');
}

/**
 * R04 — tipo de movimiento.
 *
 * R04b (retiro de cajero) no aparece aqui a proposito: un retiro es gasto como
 * cualquier otro, y su categoria `Efectivo` ya viene del banco. La regla existe
 * como decision documentada, no como codigo.
 */
export function clasificarTipo(
  crudo: MovimientoCrudo,
  centavos: Centavos,
  categoria: Categoria,
): TipoMovimiento {
  if (esTraspasoInterno(crudo.descripcion)) return 'traspaso';
  if (centavos > 0) return pareceReembolso(crudo.descripcion) ? 'reembolso' : 'ingreso';
  return categoria === 'Ingresos' ? 'ingreso' : 'gasto';
}

export { SIN_CATEGORIA };
