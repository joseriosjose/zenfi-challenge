/**
 * Conciliacion mensual. Divulga las reglas en un solo lugar: que quedo fuera,
 * por que, y el boton para meterlo de vuelta.
 *
 * Una regla que no se puede ver ni deshacer deja de ser regla y se vuelve una
 * opinion del sistema. Esta pantalla existe para que no lo sea.
 */
import { formatearMonto } from '../dominio/modelo';
import type { ReglaExclusion } from '../dominio/derivar';
import type { Conciliacion, FamiliaId, Renglon, Suma } from '../dominio/conciliacion';

/**
 * Un mapa por enum. Los tres titulos dicen QUIEN tiene que hacer algo —nadie,
 * tu, el banco—, no si el movimiento cuenta: eso ya lo dijo el titulo de la
 * pantalla, y repetirlo gastaba el renglon en informacion que el usuario ya
 * tiene.
 *
 * La llave sigue siendo el concepto del dominio (`resuelto`) y el titulo es
 * como se lo contamos a una persona. No tienen por que ser la misma frase.
 */
const FAMILIA: Record<FamiliaId, string> = {
  resuelto: 'Nada que decidir',
  decision: 'Necesitan tu decisión',
  'todavia-no': 'Esperan a tu banco',
};

/**
 * Que puede hacer el usuario aqui mismo, por regla. `null` no significa que no
 * se pueda deshacer —el detalle siempre deja incluirlo—, significa que no vale
 * la pena ofrecerlo: en un traspaso no hay duda que resolver, y un cargo
 * pendiente entra solo cuando el banco lo confirme. Un boton repetido cuatro
 * veces debajo de "entran solos" se contradice con su propio grupo.
 */
const ACCION: Record<ReglaExclusion, string | null> = {
  R04a: null,
  R06: 'Son distintos, cuéntalo',
  R08: null,
  R09: 'Contarlo como pesos',
};

/**
 * La respuesta contraria: dar la exclusion por buena. No mueve el total, pero
 * saca la tarjeta de "necesitan tu decisión" — sin esto solo se puede
 * contestar que no, y el grupo sigue preguntando para siempre.
 */
const CONFIRMAR: Record<ReglaExclusion, string | null> = {
  R04a: null,
  R06: 'Sí, es repetido',
  R08: null,
  R09: 'Déjalo fuera',
};

function textoDeSumas(sumas: Suma[]): string {
  return sumas.map((s) => formatearMonto(s.centavos, s.moneda)).join(' + ');
}

/* ------------------------------------------------------------------ */

function Tarjeta({ renglon, onAbrir, onIncluir, onConfirmar }: {
  renglon: Renglon;
  onAbrir: (id: string) => void;
  onIncluir: (id: string) => void;
  onConfirmar: (id: string) => void;
}) {
  const { movimiento, exclusion } = renglon;
  const accion = ACCION[exclusion.regla];
  const confirmar = movimiento.exclusionConfirmada ? null : CONFIRMAR[exclusion.regla];
  const conBotones = accion !== null || confirmar !== null;

  return (
    <div className="border-t border-hairline first:border-t-0">
      <button
        type="button"
        onClick={() => onAbrir(movimiento.id)}
        className={`flex w-full items-start gap-3 px-4 pt-4 text-left ${
          conBotones ? 'pb-2' : 'pb-4'
        }`}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate text-body-md font-semibold uppercase">
              {movimiento.descripcion}
            </span>
            <span className="shrink-0 font-mono text-amount-sm font-semibold text-ink-muted">
              {formatearMonto(movimiento.centavos, movimiento.original.moneda)}
            </span>
          </span>

          {/* Solo el motivo. El porque completo esta en el detalle, a un toque
              de aqui, y repetirlo en cada renglon alarga la lista sin decir
              nada nuevo. */}
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-[4px] bg-revisar/12 px-1.5 py-0.5 text-label-caps text-revisar uppercase">
              {exclusion.motivo}
            </span>
            {movimiento.exclusionConfirmada && (
              <span className="rounded-[4px] bg-jade/12 px-1.5 py-0.5 text-label-caps text-jade uppercase">
                Lo diste por bueno
              </span>
            )}
          </span>
        </span>

        <span className="mt-2 shrink-0 self-center text-ink-faint">›</span>
      </button>

      {conBotones && (
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {confirmar !== null && (
            <button
              type="button"
              onClick={() => onConfirmar(movimiento.id)}
              className="h-9 rounded-control bg-canopy-to px-4 text-body-sm font-semibold text-mint"
            >
              {confirmar}
            </button>
          )}
          {accion !== null && (
            <button
              type="button"
              onClick={() => onIncluir(movimiento.id)}
              className="h-9 rounded-control border border-hairline px-4 text-body-sm font-semibold text-ink-muted"
            >
              {accion}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Excluidos({
  conciliacion,
  nombreDelMes,
  onVolver,
  onAbrirMovimiento,
  onIncluir,
  onConfirmar,
}: {
  conciliacion: Conciliacion;
  nombreDelMes: string;
  onVolver: () => void;
  onAbrirMovimiento: (id: string) => void;
  onIncluir: (id: string) => void;
  onConfirmar: (id: string) => void;
}) {
  return (
    <div className="pb-10">
      <header className="flex h-14 items-center gap-3 bg-ground px-4">
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver"
          className="grid size-9 place-items-center rounded-full text-headline-md"
        >
          ←
        </button>
        <h1 className="text-headline-sm">Conciliación mensual</h1>
      </header>

      {conciliacion.movimientos === 0 ? (
        <section className="card mx-4 mt-2">
          <h2 className="text-headline-sm">Todo cuenta este mes</h2>
          <p className="mt-1 text-body-md text-ink-muted">
            Ningún movimiento de {nombreDelMes.toLowerCase()} quedó fuera de tus totales.
          </p>
        </section>
      ) : (
        <>
          <section className="px-4 pt-1 pb-2">
            <p className="text-headline-md">
              Tu gasto de {nombreDelMes.toLowerCase()} no incluye{' '}
              {conciliacion.movimientos === 1
                ? 'este movimiento'
                : `estos ${conciliacion.movimientos} movimientos`}
              .
            </p>
            <p className="mt-3 font-mono text-body-sm text-ink-faint">
              Suman {textoDeSumas(conciliacion.sumas)}
            </p>
          </section>

          {conciliacion.grupos.map((grupo) => (
            <section key={grupo.id} className="mt-4">
              <div className="flex items-baseline justify-between gap-3 px-4 pb-2">
                <h2 className="text-headline-sm">{FAMILIA[grupo.id]}</h2>
                <span className="shrink-0 font-mono text-body-sm text-ink-muted">
                  {textoDeSumas(grupo.sumas)}
                </span>
              </div>
              <div className="mx-4 overflow-hidden rounded-card bg-card shadow-card">
                {grupo.renglones.map((renglon) => (
                  <Tarjeta
                    key={renglon.movimiento.id}
                    renglon={renglon}
                    onAbrir={onAbrirMovimiento}
                    onIncluir={onIncluir}
                    onConfirmar={onConfirmar}
                  />
                ))}
              </div>
            </section>
          ))}

        </>
      )}
    </div>
  );
}
