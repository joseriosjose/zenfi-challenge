/**
 * Nombres de fecha en español. Es presentacion, no dominio: nadie decide nada
 * con esto, solo se lee.
 *
 * Vive aparte porque tres pantallas lo pedian. TODO se arma cortando el texto
 * ISO que mando el banco, sin construir un `Date`: un `toLocaleString` sobre
 * `2026-08-18T21:05:00-06:00` se renderiza en el huso del navegador, y desde
 * UTC ese cargo aparece a las 03:05 del dia siguiente. La hora que vale es la
 * que registro el banco.
 */
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** `2026-08` -> `agosto`. */
export function nombreDelMes(periodo: string): string {
  return MESES[Number(periodo.slice(5, 7)) - 1] ?? periodo;
}

/** `2026-08` -> `Agosto 2026`. */
export function etiquetaDeMes(periodo: string): string {
  const nombre = nombreDelMes(periodo);
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${periodo.slice(0, 4)}`;
}

/** `2026-08-15` -> `sábado 15 de agosto`. */
export function etiquetaDeDia(dia: string): string {
  const anio = Number(dia.slice(0, 4));
  const mes = Number(dia.slice(5, 7)) - 1;
  const numero = Number(dia.slice(8, 10));
  const nombre = DIAS[new Date(anio, mes, numero).getDay()] ?? '';
  return `${nombre} ${numero} de ${MESES[mes] ?? ''}`;
}

/** `HH:MM` del banco. Formato de 24 h en toda la app. */
export function horaDe(iso: string): string {
  return iso.slice(11, 16);
}

/** `15 ago`, para renglones donde el año sobra. */
export function diaCorto(iso: string): string {
  const mes = MESES[Number(iso.slice(5, 7)) - 1]?.slice(0, 3) ?? '';
  return `${Number(iso.slice(8, 10))} ${mes}`;
}

/** `15 ago 2026, 09:25`. */
export function fechaLarga(iso: string): string {
  return `${diaCorto(iso)} ${iso.slice(0, 4)}, ${horaDe(iso)}`;
}
