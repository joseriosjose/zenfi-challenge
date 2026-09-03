/* Modulo de datos, no de componentes: exporta un mapa, no UI. Es .tsx solo
   porque el mapa incluye iconos en JSX, y partirlo en dos archivos romperia
   la regla 3 (un mapa por enum, en UN archivo). No hay componente que
   recargar en caliente, asi que fast refresh no pierde nada. */
/* eslint-disable react-refresh/only-export-components */

/**
 * Mapa por enum, en un archivo (regla 3 de docs/ARQUITECTURA.md).
 *
 * Cada categoria se traduce a color e icono una sola vez. Un `switch`
 * repartido en dos componentes diverge; una tabla no puede.
 *
 * Las clases van literales a proposito: Tailwind escanea el fuente como texto
 * plano, asi que `bg-cat-${nombre}` no generaria ninguna regla CSS.
 */
import type { ReactNode } from 'react';
import type { Categoria } from '../dominio/modelo';

type Estilo = {
  /** Color solido, para la barra segmentada. */
  barra: string;
  /** Fondo tenue del contenedor del icono. */
  fondo: string;
  /** Color del icono y del glifo. */
  texto: string;
  icono: ReactNode;
};

const trazo = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/* Los iconos son elementos JSX, no componentes: asi el archivo no mezcla
   componentes con funciones exportadas y fast refresh sigue funcionando. */

const casa = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

const carrito = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M3 4h2l2.2 10.5h10.1L20 7H6" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
  </svg>
);

const bolsa = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

const flechas = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M4 9h13l-3-3" />
    <path d="M20 15H7l3 3" />
  </svg>
);

const billete = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);

const cubiertos = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M7 3v8m0 0v10M5 3v5a2 2 0 0 0 4 0V3" />
    <path d="M17 3c-1.5 1.5-2 3-2 5s.5 2.5 2 2.5V21" />
  </svg>
);

const etiqueta = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M4 12.5V5a1 1 0 0 1 1-1h7.5L20 11.5 12.5 19 4 12.5Z" />
    <circle cx="8.5" cy="8.5" r="1.1" />
  </svg>
);

/** Las 6 categorias con identidad propia en el diseño; el resto cae en `otras`. */
const ESTILOS: Partial<Record<Categoria, Estilo>> = {
  Vivienda: {
    barra: 'bg-cat-vivienda',
    fondo: 'bg-cat-vivienda/12',
    texto: 'text-cat-vivienda',
    icono: casa,
  },
  Supermercado: {
    barra: 'bg-cat-supermercado',
    fondo: 'bg-cat-supermercado/12',
    texto: 'text-cat-supermercado',
    icono: carrito,
  },
  Compras: {
    barra: 'bg-cat-compras',
    fondo: 'bg-cat-compras/12',
    texto: 'text-cat-compras',
    icono: bolsa,
  },
  Transferencias: {
    barra: 'bg-cat-transferencias',
    fondo: 'bg-cat-transferencias/12',
    texto: 'text-cat-transferencias',
    icono: flechas,
  },
  Efectivo: {
    barra: 'bg-cat-efectivo',
    fondo: 'bg-cat-efectivo/12',
    texto: 'text-cat-efectivo',
    icono: billete,
  },
  Comida: {
    barra: 'bg-cat-comida',
    fondo: 'bg-cat-comida/12',
    texto: 'text-cat-comida',
    icono: cubiertos,
  },
};

const OTRAS: Estilo = {
  barra: 'bg-cat-otras',
  fondo: 'bg-cat-otras/12',
  texto: 'text-cat-otras',
  icono: etiqueta,
};

export function estiloDe(categoria: Categoria): Estilo {
  return ESTILOS[categoria] ?? OTRAS;
}

export { OTRAS as ESTILO_OTRAS };
