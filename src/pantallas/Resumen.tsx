/**
 * Pantalla de resumen. Compone y orquesta; no calcula.
 * Todo numero que aparece aqui viene ya resuelto por la capa de dominio.
 */
import { useState } from 'react';
import { formatearMXN } from '../dominio/modelo';
import type { MesDisponible, Movimiento } from '../dominio/derivar';
import { agruparOtras, masRecientes, titularDelMes } from '../dominio/resumen';
import type { GastoPorCategoria, Otras, Resumen as ResumenDelMes } from '../dominio/resumen';
import { ESTILO_OTRAS, estiloDe } from '../ui/categorias';
import { diaCorto, etiquetaDeMes, nombreDelMes } from '../ui/fechas';

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function SelectorMes({
  periodo,
  meses,
  onElegir,
}: {
  periodo: string;
  meses: MesDisponible[];
  onElegir: (periodo: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-headline-sm text-white"
      >
        {etiquetaDeMes(periodo)}
        <Chevron abierto={abierto} />
      </button>

      {abierto && (
        <>
          {/* Capta el clic fuera para cerrar, sin listeners globales. */}
          <button
            type="button"
            aria-label="Cerrar selector de mes"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <ul className="absolute top-full left-0 z-20 mt-2 w-56 overflow-hidden rounded-card border border-hairline bg-card shadow-sheet">
            {meses.map((m) => (
              <li key={m.periodo}>
                <button
                  type="button"
                  onClick={() => {
                    onElegir(m.periodo);
                    setAbierto(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-body-md ${
                    m.periodo === periodo ? 'bg-ground font-semibold text-jade' : 'text-ink'
                  }`}
                >
                  {etiquetaDeMes(m.periodo)}
                  <span className="font-mono text-label-tabular text-ink-faint">
                    {m.movimientos}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Encabezado({
  resumen,
  periodo,
  meses,
  onElegirMes,
}: {
  resumen: ResumenDelMes;
  periodo: string;
  meses: MesDisponible[];
  onElegirMes: (periodo: string) => void;
}) {
  const mes = nombreDelMes(periodo);
  const [enteros, decimales] = formatearMXN(resumen.gastoCentavos).split('.');
  const titular = titularDelMes(resumen);

  return (
    <section className="bg-linear-to-b from-canopy-from to-canopy-to px-4 pt-4 pb-9 text-white">
      <SelectorMes periodo={periodo} meses={meses} onElegir={onElegirMes} />

      <div className="mt-4 mb-5 flex flex-col items-center text-center">
        <span className="text-label-caps text-mint/70 uppercase">Gastaste en {mes}</span>
        <p className="mt-1 font-mono text-amount-lg">
          {enteros}
          <span className="text-[30px] font-normal text-white/80">.{decimales}</span>
        </p>
        {titular !== null && (
          <p className="mt-2 max-w-[310px] text-body-md text-white/80">{titular}</p>
        )}
      </div>

      <div className="grid grid-cols-2 rounded-control bg-white/6 p-3">
        <div className="flex flex-col items-start pr-3">
          <span className="text-label-caps text-mint/70 uppercase">Entró</span>
          <span className="mt-0.5 font-mono text-amount-md">
            {formatearMXN(resumen.ingresoCentavos)}
          </span>
        </div>
        <div className="flex flex-col items-start border-l border-mint/20 pl-3">
          <span className="text-label-caps text-mint/70 uppercase">Balance</span>
          <span className="mt-0.5 font-mono text-amount-md">
            {formatearMXN(resumen.balanceCentavos)}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FilaCategoria({ gasto }: { gasto: GastoPorCategoria }) {
  const estilo = estiloDe(gasto.categoria);
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${estilo.fondo} ${estilo.texto}`}
        >
          {estilo.icono}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-body-lg font-semibold">{gasto.categoria}</span>
          {gasto.reembolsadoCentavos > 0 && (
            <span className="mt-0.5 text-body-sm text-ink-faint">
              Ya descontamos un reembolso de {formatearMXN(gasto.reembolsadoCentavos)}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="font-mono text-amount-sm font-semibold">
          {formatearMXN(gasto.centavos)}
        </span>
        <span className="font-mono text-label-tabular text-ink-faint">
          {Math.round(gasto.pct)}%
        </span>
      </div>
    </div>
  );
}

function FilaOtras({ otras }: { otras: Otras }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${ESTILO_OTRAS.fondo} ${ESTILO_OTRAS.texto}`}
        >
          {ESTILO_OTRAS.icono}
        </span>
        <div className="flex flex-col">
          <span className="text-body-lg font-semibold">Otras</span>
          <span className="mt-0.5 text-body-sm text-ink-faint">
            {otras.categorias} categorías
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-amount-sm font-semibold">
          {formatearMXN(otras.centavos)}
        </span>
        <span className="font-mono text-label-tabular text-ink-faint">
          {Math.round(otras.pct)}%
        </span>
      </div>
    </div>
  );
}

function Desglose({ resumen }: { resumen: ResumenDelMes }) {
  const [todas, setTodas] = useState(false);
  // La barra siempre resume en 3 + Otras: con 14 segmentos y separacion no
  // cabria en el ancho, y dejaria de leerse de un vistazo. La lista de abajo
  // es la que se expande.
  const barra = agruparOtras(resumen.porCategoria, 3);
  const { principales, otras } = agruparOtras(resumen.porCategoria, todas ? 99 : 3);

  if (resumen.porCategoria.length === 0) {
    return (
      <section className="card relative z-10 -mt-6 mx-4">
        <h2 className="text-headline-sm">En qué se te fue</h2>
        <p className="mt-2 text-body-md text-ink-muted">
          Este mes no tiene gasto que sumar.
        </p>
      </section>
    );
  }

  return (
    <section className="card relative z-10 -mt-6 mx-4">
      <h2 className="pb-3 text-headline-sm">En qué se te fue</h2>

      <div className="my-1 flex h-5 gap-[3px] overflow-hidden rounded-chip bg-ground">
        {barra.principales.map((c) => (
          <span
            key={c.categoria}
            className={`h-full rounded-sm ${estiloDe(c.categoria).barra}`}
            style={{ width: `${c.pct}%` }}
            title={`${c.categoria} ${Math.round(c.pct)}%`}
          />
        ))}
        {barra.otras !== null && (
          <span
            className={`h-full rounded-sm ${ESTILO_OTRAS.barra}`}
            style={{ width: `${barra.otras.pct}%` }}
            title={`Otras ${Math.round(barra.otras.pct)}%`}
          />
        )}
      </div>

      <div className="mt-2 divide-y divide-hairline">
        {principales.map((c) => (
          <FilaCategoria key={c.categoria} gasto={c} />
        ))}
        {otras !== null && <FilaOtras otras={otras} />}
      </div>

      {resumen.porCategoria.length > 3 && (
        <button
          type="button"
          onClick={() => setTodas((v) => !v)}
          aria-expanded={todas}
          className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-hairline pt-3 text-body-sm text-ink-muted"
        >
          {todas ? 'Ver menos' : `Ver las ${resumen.porCategoria.length} categorías`}
          <Chevron abierto={todas} />
        </button>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function TiraExcluidos({
  excluidos,
  onAbrir,
}: {
  excluidos: Movimiento[];
  onAbrir: () => void;
}) {
  if (excluidos.length === 0) return null;

  // Los motivos distintos, no los siete renglones: el detalle es de su vista.
  const motivos = [...new Set(excluidos.map((m) => m.exclusion?.motivo ?? ''))];

  return (
    <section className="mx-4 mt-4">
      <button
        type="button"
        onClick={onAbrir}
        className="flex w-full items-center gap-2.5 rounded-[14px] bg-revisar/8 px-3.5 py-3 text-left inset-ring inset-ring-revisar/20"
      >
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-revisar/18 font-mono text-[11px] font-bold text-revisar">
          i
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-body-md font-semibold">
            {excluidos.length === 1
              ? '1 movimiento excluido del cálculo'
              : `${excluidos.length} movimientos excluidos del cálculo`}
          </span>
          <span className="mt-0.5 text-body-sm text-ink-faint">
            {motivos.slice(0, 3).join(' · ')}
          </span>
        </span>
        <span className="ml-auto shrink-0 text-revisar">›</span>
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FilaMovimiento({
  movimiento,
  onAbrir,
}: {
  movimiento: Movimiento;
  onAbrir: (id: string) => void;
}) {
  const estilo = estiloDe(movimiento.categoria);
  const esAbono = movimiento.centavos > 0;
  const ajustado =
    movimiento.origenCategoria === 'consenso' ||
    movimiento.origenCategoria === 'catalogo' ||
    movimiento.origenCategoria === 'usuario';

  return (
    <button
      type="button"
      onClick={() => onAbrir(movimiento.id)}
      className="flex w-full items-center justify-between gap-3 py-3 text-left"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-headline-sm ${estilo.fondo} ${estilo.texto}`}
        >
          {movimiento.descripcion.charAt(0)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-body-md font-semibold uppercase">
            {movimiento.descripcion}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-body-sm text-ink-faint">
            {ajustado && <span className="size-1.5 shrink-0 rounded-full bg-revisar" />}
            {movimiento.categoria} · {diaCorto(movimiento.fecha)}
          </span>
        </span>
      </span>
      <span
        className={`shrink-0 font-mono text-amount-sm font-semibold ${esAbono ? 'text-jade' : ''}`}
      >
        {esAbono ? '+' : ''}
        {formatearMXN(movimiento.centavos)}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function Resumen({
  resumen,
  periodo,
  meses,
  onElegirMes,
  onAbrirMovimiento,
  onVerTodos,
  onVerExcluidos,
}: {
  resumen: ResumenDelMes;
  periodo: string;
  meses: MesDisponible[];
  onElegirMes: (periodo: string) => void;
  onAbrirMovimiento: (id: string) => void;
  onVerTodos: () => void;
  onVerExcluidos: () => void;
}) {
  const visibles = masRecientes(resumen.incluidos, 5);

  return (
    <div className="pb-8">
      <header className="flex h-14 items-center gap-2 bg-ground px-4">
        <h1 className="text-headline-sm text-jade uppercase">Resumen</h1>
      </header>

      <Encabezado resumen={resumen} periodo={periodo} meses={meses} onElegirMes={onElegirMes} />
      <Desglose resumen={resumen} />
      <TiraExcluidos excluidos={resumen.excluidos} onAbrir={onVerExcluidos} />

      <section className="card mx-4 mt-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-headline-sm">Movimientos recientes</h2>
          <button type="button" onClick={onVerTodos} className="text-body-md font-semibold text-jade">
            Ver todos
          </button>
        </div>
        {visibles.length === 0 ? (
          <p className="text-body-md text-ink-muted">
            Ningún movimiento de este mes entró en el cálculo.
          </p>
        ) : (
          <div className="divide-y divide-hairline">
            {visibles.map((m) => (
              <FilaMovimiento key={m.id} movimiento={m} onAbrir={onAbrirMovimiento} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
