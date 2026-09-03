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

const coche = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M4 16v-3l2-5h12l2 5v3" />
    <path d="M3 16h18v3h-3v-3M6 19H3v-3" />
    <circle cx="7.5" cy="16" r="1.1" />
    <circle cx="16.5" cy="16" r="1.1" />
  </svg>
);

const cruz = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </svg>
);

const rayo = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M13 3 5 13.5h6L11 21l8-10.5h-6L13 3Z" />
  </svg>
);

const calendario = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
);

const claqueta = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <rect x="3" y="6" width="18" height="14" rx="3" />
    <path d="M3 11h18M8.5 6l-2 5M14 6l-2 5" />
  </svg>
);

const escudo = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M12 3.5 5 6v6c0 4 3 7.2 7 8.5 4-1.3 7-4.5 7-8.5V6l-7-2.5Z" />
  </svg>
);

const avion = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4v2l-7-2v4l2.5 2v1.5L12 19l-4 1.5V19l2.5-2v-4l-7 2v-2l7-4V3.5Z" />
  </svg>
);

const entrada = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M12 20V5M6.5 10.5 12 5l5.5 5.5" />
  </svg>
);

const tarjeta = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <rect x="3" y="5.5" width="18" height="13" rx="3" />
    <path d="M3 10h18M6.5 15h3" />
  </svg>
);

const porcentaje = (
  <svg viewBox="0 0 24 24" className="size-5" {...trazo}>
    <path d="M6.5 17.5 17.5 6.5" />
    <circle cx="8" cy="8" r="2.2" />
    <circle cx="16" cy="16" r="2.2" />
  </svg>
);

/**
 * Todas las categorias, no solo las del resumen: la hoja para corregir la
 * categoria las muestra a las 17 juntas, y once grises iguales no se pueden
 * distinguir de un vistazo. `Sin categoria` comparte el estilo neutro a
 * proposito — es la ausencia de categoria, no una mas.
 */
const ESTILOS: Record<Categoria, Estilo> = {
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
  Transporte: {
    barra: 'bg-cat-transporte',
    fondo: 'bg-cat-transporte/12',
    texto: 'text-cat-transporte',
    icono: coche,
  },
  Salud: {
    barra: 'bg-cat-salud',
    fondo: 'bg-cat-salud/12',
    texto: 'text-cat-salud',
    icono: cruz,
  },
  Servicios: {
    barra: 'bg-cat-servicios',
    fondo: 'bg-cat-servicios/12',
    texto: 'text-cat-servicios',
    icono: rayo,
  },
  Suscripciones: {
    barra: 'bg-cat-suscripciones',
    fondo: 'bg-cat-suscripciones/12',
    texto: 'text-cat-suscripciones',
    icono: calendario,
  },
  Entretenimiento: {
    barra: 'bg-cat-entretenimiento',
    fondo: 'bg-cat-entretenimiento/12',
    texto: 'text-cat-entretenimiento',
    icono: claqueta,
  },
  Seguros: {
    barra: 'bg-cat-seguros',
    fondo: 'bg-cat-seguros/12',
    texto: 'text-cat-seguros',
    icono: escudo,
  },
  Viajes: {
    barra: 'bg-cat-viajes',
    fondo: 'bg-cat-viajes/12',
    texto: 'text-cat-viajes',
    icono: avion,
  },
  Ingresos: {
    barra: 'bg-cat-ingresos',
    fondo: 'bg-cat-ingresos/12',
    texto: 'text-cat-ingresos',
    icono: entrada,
  },
  Pagos: {
    barra: 'bg-cat-pagos',
    fondo: 'bg-cat-pagos/12',
    texto: 'text-cat-pagos',
    icono: tarjeta,
  },
  Comisiones: {
    barra: 'bg-cat-comisiones',
    fondo: 'bg-cat-comisiones/12',
    texto: 'text-cat-comisiones',
    icono: porcentaje,
  },
  'Sin categoría': {
    barra: 'bg-cat-otras',
    fondo: 'bg-cat-otras/12',
    texto: 'text-cat-otras',
    icono: etiqueta,
  },
};

const OTRAS: Estilo = {
  barra: 'bg-cat-otras',
  fondo: 'bg-cat-otras/12',
  texto: 'text-cat-otras',
  icono: etiqueta,
};

export function estiloDe(categoria: Categoria): Estilo {
  return ESTILOS[categoria];
}

export { OTRAS as ESTILO_OTRAS };
