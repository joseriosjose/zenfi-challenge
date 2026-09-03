/**
 * Nombres de fecha en español. Es presentacion, no dominio: nadie decide nada
 * con esto, solo se lee.
 *
 * Vive aparte porque tres pantallas lo pedian. Todo se arma con los numeros
 * del ISO local que mando el banco, sin construir un `Date`, para que el huso
 * del navegador no corra un cargo de medianoche al dia anterior.
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

/** `15 ago`, para renglones donde el año sobra. */
export function diaCorto(fecha: Date): string {
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]?.slice(0, 3) ?? ''}`;
}
