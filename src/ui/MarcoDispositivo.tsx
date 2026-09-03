/**
 * En web el layout siempre va centrado, simulando el tamaño del dispositivo.
 * El diseño es mobile-first (390px), asi que fuera de ese ancho no se estira:
 * se enmarca.
 */
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function MarcoDispositivo({
  children,
  vista,
}: {
  children: ReactNode;
  /** Cambiar este valor devuelve el scroll al tope, como haria una navegacion real. */
  vista: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    contenedor.current?.scrollTo({ top: 0 });
  }, [vista]);

  return (
    <div className="flex min-h-dvh justify-center bg-ground py-0 sm:bg-hairline sm:py-8">
      <div
        className="
          relative flex w-full max-w-[390px] flex-col overflow-hidden bg-ground
          sm:h-[844px] sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-sheet
        "
      >
        <div ref={contenedor} className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
