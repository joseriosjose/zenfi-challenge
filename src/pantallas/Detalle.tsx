/**
 * Detalle de un movimiento. Aqui vive el requisito #2: corregir la categoria.
 *
 * Muestra el registro original sin tocar, y cuando una regla cambio algo lo
 * dice con su evidencia. Una regla que no se puede ver ni deshacer deja de ser
 * regla y se vuelve una opinion del sistema.
 */
import { CATEGORIAS, formatearMXN } from '../dominio/modelo';
import type { Categoria } from '../dominio/modelo';
import type { Movimiento } from '../dominio/derivar';
import { estiloDe } from '../ui/categorias';

/** Cada origen se explica una sola vez, como tabla. */
const EXPLICACION: Record<Movimiento['origenCategoria'], string | null> = {
  banco: null,
  consenso: 'La dedujimos de los otros cargos del mismo comercio',
  catalogo: 'La sugerimos nosotros: este comercio aparece una sola vez',
  usuario: 'La corregiste tú',
  'sin-match': 'No pudimos identificar el comercio, así que no la adivinamos',
};

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className="text-body-sm text-ink-faint">{etiqueta}</span>
      <span className="text-right font-mono text-body-sm break-all">{valor}</span>
    </div>
  );
}

export function Detalle({
  movimiento,
  onVolver,
  onCambiarCategoria,
  onIncluir,
}: {
  movimiento: Movimiento;
  onVolver: () => void;
  onCambiarCategoria: (id: string, categoria: Categoria) => void;
  onIncluir: (id: string) => void;
}) {
  const estilo = estiloDe(movimiento.categoria);
  const explicacion = EXPLICACION[movimiento.origenCategoria];
  const esAbono = movimiento.centavos > 0;

  return (
    <div className="pb-10">
      <header className="flex h-14 items-center gap-3 bg-ground px-4">
        <button
          type="button"
          onClick={onVolver}
          className="grid size-9 place-items-center rounded-full bg-card text-headline-md"
          aria-label="Volver"
        >
          ←
        </button>
        <h1 className="text-headline-sm">Detalle</h1>
      </header>

      {/* Identidad y monto */}
      <section className="bg-linear-to-b from-canopy-from to-canopy-to px-4 pt-4 pb-8 text-center text-white">
        <span
          className={`mx-auto grid size-14 place-items-center rounded-full ${estilo.fondo} ${estilo.texto}`}
        >
          {estilo.icono}
        </span>
        <p className="mt-3 text-body-lg font-semibold uppercase">{movimiento.descripcion}</p>
        <p className={`mt-1 font-mono text-amount-lg ${esAbono ? 'text-mint' : ''}`}>
          {esAbono ? '+' : ''}
          {formatearMXN(movimiento.centavos)}
        </p>
        <p className="mt-1 text-body-sm text-white/70">
          {movimiento.fecha.toLocaleDateString('es-MX', { dateStyle: 'long' })}
          {movimiento.cuenta !== null ? ` · ${movimiento.cuenta}` : ' · Sin cuenta'}
        </p>
      </section>

      {/* Por que no cuenta */}
      {movimiento.exclusion !== null && (
        <section className="mx-4 -mt-5 rounded-card border border-revisar/20 bg-revisar/8 p-4">
          <p className="text-body-md font-semibold text-revisar">
            {movimiento.exclusion.motivo}
          </p>
          <p className="mt-1 text-body-sm text-ink-muted">
            No entra en tus totales de este mes. Lo decidió la regla{' '}
            {movimiento.exclusion.regla}.
          </p>
          <button
            type="button"
            onClick={() => onIncluir(movimiento.id)}
            className="mt-3 h-11 w-full rounded-control bg-revisar text-body-lg font-semibold text-white"
          >
            Incluir en mis totales
          </button>
        </section>
      )}

      {/* Requisito #2 — corregir la categoria */}
      <section className={`card mx-4 ${movimiento.exclusion === null ? '-mt-5' : 'mt-4'}`}>
        <h2 className="text-headline-sm">Categoría</h2>
        {explicacion !== null && (
          <p className="mt-1 text-body-sm text-ink-muted">{explicacion}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CATEGORIAS.map((categoria) => {
            const activa = categoria === movimiento.categoria;
            const estiloCat = estiloDe(categoria);
            return (
              <button
                key={categoria}
                type="button"
                onClick={() => onCambiarCategoria(movimiento.id, categoria)}
                className={`flex items-center gap-2 rounded-chip border px-3 py-2 text-left text-body-md ${
                  activa
                    ? 'border-canopy-to bg-canopy-to text-mint'
                    : 'border-hairline bg-card text-ink-muted'
                }`}
              >
                <span className={`size-1.5 shrink-0 rounded-full ${estiloCat.barra}`} />
                <span className="truncate">{categoria}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* El registro original, intacto */}
      <section className="card mx-4 mt-4">
        <h2 className="text-headline-sm">Como lo envió tu banco</h2>
        <div className="mt-2 divide-y divide-hairline">
          <Campo etiqueta="id" valor={movimiento.original.id} />
          <Campo etiqueta="fecha" valor={movimiento.original.fecha} />
          <Campo etiqueta="descripcion" valor={movimiento.original.descripcion} />
          <Campo etiqueta="monto" valor={JSON.stringify(movimiento.original.monto)} />
          <Campo etiqueta="moneda" valor={movimiento.original.moneda} />
          <Campo etiqueta="categoria" valor={JSON.stringify(movimiento.original.categoria)} />
          <Campo etiqueta="cuenta" valor={JSON.stringify(movimiento.original.cuenta)} />
          <Campo etiqueta="estado" valor={movimiento.original.estado} />
        </div>
      </section>
    </div>
  );
}
