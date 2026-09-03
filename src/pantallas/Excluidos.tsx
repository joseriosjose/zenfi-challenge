/**
 * Fuera del cálculo. Divulga las reglas en un solo lugar: que quedo fuera,
 * por que, y el boton para meterlo de vuelta.
 *
 * Una regla que no se puede ver ni deshacer deja de ser regla y se vuelve una
 * opinion del sistema. Esta pantalla existe para que no lo sea.
 */
import { formatearMonto } from '../dominio/modelo';
import type { ReglaExclusion } from '../dominio/derivar';
import type { Conciliacion, FamiliaId, Renglon, Suma } from '../dominio/conciliacion';
import { estiloDe } from '../ui/categorias';

/** Un mapa por enum. El titulo dice que se espera del usuario en ese grupo. */
const FAMILIA: Record<FamiliaId, { titulo: string; nota: string }> = {
  'no-es-gasto': {
    titulo: 'No es un gasto',
    nota: 'Está bien así. No tienes que hacer nada.',
  },
  decision: {
    titulo: 'Necesitan tu decisión',
    nota: 'Aquí tú sabes algo que nosotros no.',
  },
  'todavia-no': {
    titulo: 'Todavía no cuentan',
    nota: 'Esperan a tu banco. Entran solos cuando se resuelvan.',
  },
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

function textoDeSumas(sumas: Suma[]): string {
  return sumas.map((s) => formatearMonto(s.centavos, s.moneda)).join(' + ');
}

/* ------------------------------------------------------------------ */

function Tarjeta({ renglon, onAbrir, onIncluir }: {
  renglon: Renglon;
  onAbrir: (id: string) => void;
  onIncluir: (id: string) => void;
}) {
  const { movimiento, exclusion } = renglon;
  const estilo = estiloDe(movimiento.categoria);
  const accion = ACCION[exclusion.regla];

  return (
    <div className="border-t border-hairline first:border-t-0">
      <button
        type="button"
        onClick={() => onAbrir(movimiento.id)}
        className={`flex w-full items-start gap-3 px-4 pt-4 text-left ${
          accion === null ? 'pb-4' : 'pb-2'
        }`}
      >
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-headline-sm ${estilo.fondo} ${estilo.texto}`}
        >
          {movimiento.descripcion.charAt(0)}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-baseline justify-between gap-3">
            <span className="truncate text-body-md font-semibold uppercase">
              {movimiento.descripcion}
            </span>
            <span className="shrink-0 font-mono text-amount-sm font-semibold text-ink-muted">
              {formatearMonto(movimiento.centavos, movimiento.original.moneda)}
            </span>
          </span>

          <span className="mt-1 self-start rounded-[4px] bg-revisar/12 px-1.5 py-0.5 text-label-caps text-revisar uppercase">
            {exclusion.motivo}
          </span>

          <span className="mt-1.5 text-body-sm text-ink-muted">{exclusion.detalle}</span>
        </span>

        <span className="mt-2 shrink-0 self-center text-ink-faint">›</span>
      </button>

      {accion !== null && (
        <div className="px-4 pb-4 pl-13">
          <button
            type="button"
            onClick={() => onIncluir(movimiento.id)}
            className="h-9 rounded-control bg-canopy-to px-4 text-body-sm font-semibold text-mint"
          >
            {accion}
          </button>
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
}: {
  conciliacion: Conciliacion;
  nombreDelMes: string;
  onVolver: () => void;
  onAbrirMovimiento: (id: string) => void;
  onIncluir: (id: string) => void;
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
        <h1 className="text-headline-sm">Fuera del cálculo</h1>
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
            <p className="text-label-caps text-jade uppercase">Conciliación mensual</p>
            <p className="mt-2 text-headline-md">
              Tu gasto de {nombreDelMes.toLowerCase()} no incluye{' '}
              {conciliacion.movimientos === 1
                ? 'este movimiento'
                : `estos ${conciliacion.movimientos} movimientos`}
              .
            </p>
            <p className="mt-1.5 text-body-md text-ink-muted">
              Ninguno se borró: aquí puedes ver por qué quedaron fuera y meter al cálculo el
              que quieras.
            </p>
            <p className="mt-3 font-mono text-body-sm text-ink-faint">
              Suman {textoDeSumas(conciliacion.sumas)}
            </p>
          </section>

          {conciliacion.grupos.map((grupo) => (
            <section key={grupo.id} className="mt-4">
              <div className="flex items-baseline justify-between gap-3 px-4 pb-2">
                <h2 className="text-headline-sm">
                  {FAMILIA[grupo.id].titulo}
                  <span className="ml-2 font-mono text-body-sm font-normal text-ink-faint">
                    {grupo.renglones.length}
                  </span>
                </h2>
                <span className="shrink-0 font-mono text-body-sm text-ink-muted">
                  {textoDeSumas(grupo.sumas)}
                </span>
              </div>
              <p className="px-4 pb-2 text-body-sm text-ink-faint">{FAMILIA[grupo.id].nota}</p>

              <div className="mx-4 overflow-hidden rounded-card bg-card shadow-card">
                {grupo.renglones.map((renglon) => (
                  <Tarjeta
                    key={renglon.movimiento.id}
                    renglon={renglon}
                    onAbrir={onAbrirMovimiento}
                    onIncluir={onIncluir}
                  />
                ))}
              </div>
            </section>
          ))}

          <p className="px-6 pt-6 text-center text-body-sm text-ink-faint">
            Toca cualquier movimiento para ver el registro completo, cambiarle la categoría o
            incluirlo de todos modos.
          </p>
        </>
      )}
    </div>
  );
}
