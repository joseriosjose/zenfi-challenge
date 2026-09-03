import movimientos from './data/movimientos.json';

/**
 * Preview del design system — sirve para verificar que los tokens quedaron
 * bien contra la imagen de referencia. Bórralo y empieza la pantalla real aquí.
 */
const App = () => (
  <main className="mx-auto max-w-5xl p-6">
    <header className="mb-8">
      <p className="label-mono">Design system</p>
      <h1 className="font-display text-4xl font-semibold tracking-tight">Movimientos</h1>
      <p className="text-ink-muted">
        {movimientos.movimientos.length} movimientos cargados desde <code className="font-mono text-sm">src/data/movimientos.json</code>.
      </p>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Paleta */}
      <section className="card">
        <p className="label-mono mb-3">Paleta</p>
        {/* Clases literales: Tailwind escanea el fuente como texto, una clase
            construida con template string (`bg-${name}`) nunca se genera. */}
        {[
          { name: 'primary', steps: ['bg-primary-900', 'bg-primary-700', 'bg-primary-600', 'bg-primary-400', 'bg-primary-300', 'bg-primary-100', 'bg-primary-50'] },
          { name: 'secondary', steps: ['bg-secondary-900', 'bg-secondary-700', 'bg-secondary-600', 'bg-secondary-400', 'bg-secondary-300', 'bg-secondary-100', 'bg-secondary-50'] },
          { name: 'tertiary', steps: ['bg-tertiary-900', 'bg-tertiary-700', 'bg-tertiary-600', 'bg-tertiary-400', 'bg-tertiary-300', 'bg-tertiary-100', 'bg-tertiary-50'] },
          { name: 'neutral', steps: ['bg-neutral-900', 'bg-neutral-700', 'bg-neutral-600', 'bg-neutral-400', 'bg-neutral-300', 'bg-neutral-100', 'bg-neutral-50'] },
        ].map(({ name, steps }) => (
          <div key={name} className="mb-3">
            <p className="font-mono text-xs">{name}</p>
            <div className="mt-1 flex overflow-hidden rounded-md">
              {steps.map((cls) => (
                <div key={cls} className={`h-6 flex-1 ${cls}`} />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Botones */}
      <section className="card">
        <p className="label-mono mb-3">Botones</p>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-control bg-primary-600 px-4 py-2 font-medium text-neutral-50 hover:bg-primary-700">
            Primary
          </button>
          <button className="rounded-control bg-neutral-200 px-4 py-2 font-medium hover:bg-neutral-300">
            Secondary
          </button>
          <button className="rounded-control bg-tertiary-900 px-4 py-2 font-medium text-neutral-50 hover:bg-tertiary-800">
            Inverted
          </button>
          <button className="rounded-control border border-tertiary-900 px-4 py-2 font-medium hover:bg-neutral-200">
            Outlined
          </button>
          <button className="rounded-control bg-danger px-4 py-2 font-medium text-neutral-50">
            Eliminar
          </button>
        </div>
      </section>

      {/* Input + nav */}
      <section className="card space-y-4">
        <p className="label-mono">Controles</p>
        <input
          type="search"
          placeholder="Buscar movimiento"
          className="w-full rounded-full border border-border bg-surface-raised px-4 py-2.5 outline-none placeholder:text-ink-muted focus:border-primary-600"
        />
        <nav className="inline-flex gap-1 rounded-full bg-neutral-200 p-1.5">
          <span className="grid size-9 place-items-center rounded-full bg-primary-600 text-neutral-50">•</span>
          <span className="grid size-9 place-items-center rounded-full text-ink-muted">•</span>
          <span className="grid size-9 place-items-center rounded-full text-ink-muted">•</span>
        </nav>
      </section>

      {/* Tipografía */}
      <section className="card">
        <p className="label-mono mb-2">Headline — Archivo Narrow</p>
        <p className="font-display text-5xl font-semibold">Aa</p>
        <p className="label-mono mt-4 mb-2">Label — Space Mono</p>
        <p className="font-mono text-3xl">Aa</p>
      </section>

      {/* Semánticos de dominio */}
      <section className="card">
        <p className="label-mono mb-3">Ingreso / Gasto</p>
        <p className="font-mono text-2xl text-ingreso">+ $12,450.00</p>
        <p className="font-mono text-2xl text-gasto">− $3,280.50</p>
      </section>
    </div>
  </main>
);

export default App;
