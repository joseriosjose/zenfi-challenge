/**
 * Panel que sube desde abajo. Primitivo: no sabe que hay dentro.
 *
 * Va `fixed` y no `absolute` porque dentro de un contenedor con scroll el
 * `inset-0` se resuelve contra el alto del contenido, no el de la pantalla, y
 * la hoja aparece al final del scroll. El marco del dispositivo tiene
 * `transform`, asi que es el bloque contenedor de este `fixed` y la hoja no
 * se escapa del telefono.
 */
import type { ReactNode } from 'react';

export type HojaProps = {
  /** Para el lector de pantalla del velo que cierra al tocar. */
  etiquetaCerrar: string;
  onCerrar: () => void;
  children: ReactNode;
};

export function Hoja({ etiquetaCerrar, onCerrar, children }: HojaProps) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label={etiquetaCerrar}
        onClick={onCerrar}
        className="absolute inset-0 cursor-default bg-canopy-to/40"
      />
      <div className="relative flex max-h-[88%] flex-col rounded-t-[28px] bg-card shadow-sheet">
        {children}
      </div>
    </div>
  );
}
