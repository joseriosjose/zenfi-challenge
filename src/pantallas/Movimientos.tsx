/**
 * Lista completa del mes, con filtros. Se abre desde "Ver todos" del resumen.
 * Compone y orquesta; los conteos, totales y grupos vienen de dominio.
 */
import { useState } from 'react';
import { formatearMXN } from '../dominio/modelo';
import type { Categoria } from '../dominio/modelo';
import type { MesDisponible, Movimiento } from '../dominio/derivar';
import {
  agruparPorDia,
  filtrar,
  filtrosActivos,
  horaDe,
  opcionesDeFiltro,
  totalizar,
} from '../dominio/lista';
import type { Filtros } from '../dominio/lista';
import { SIN_FILTROS } from '../dominio/lista';
import { estiloDe } from '../ui/categorias';
import { etiquetaDeDia, etiquetaDeMes } from '../ui/fechas';

function nombreDeCuenta(cuenta: string | null): string {
  return cuenta ?? 'Sin cuenta';
}

/* ------------------------------------------------------------------ */

function Fila({
  movimiento,
  onAbrir,
}: {
  movimiento: Movimiento;
  onAbrir: (id: string) => void;
}) {
  const estilo = estiloDe(movimiento.categoria);
  const excluido = movimiento.exclusion !== null;
  const esAbono = movimiento.centavos > 0;

  return (
    <button
      type="button"
      onClick={() => onAbrir(movimiento.id)}
      className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left ${
        excluido ? 'opacity-50' : ''
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-headline-sm ${estilo.fondo} ${estilo.texto}`}
        >
          {movimiento.descripcion.charAt(0)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={`truncate text-body-md font-semibold uppercase ${
              excluido ? 'line-through decoration-1' : ''
            }`}
          >
            {movimiento.descripcion}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-body-sm text-ink-faint">
            {excluido ? (
              <span className="shrink-0 rounded-[4px] bg-revisar/12 px-1.5 py-0.5 text-label-caps text-revisar uppercase">
                {movimiento.exclusion?.motivo}
              </span>
            ) : (
              <span className="truncate">{movimiento.categoria}</span>
            )}
            <span className="shrink-0">· {horaDe(movimiento)}</span>
          </span>
        </span>
      </span>
      <span
        className={`shrink-0 font-mono text-amount-sm font-semibold ${
          excluido ? 'line-through decoration-1' : esAbono ? 'text-jade' : ''
        }`}
      >
        {esAbono ? '+' : ''}
        {formatearMXN(movimiento.centavos)}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function PanelFiltros({
  movimientos,
  filtros,
  periodo,
  meses,
  onCambiar,
  onElegirMes,
  onCerrar,
}: {
  movimientos: Movimiento[];
  filtros: Filtros;
  periodo: string;
  meses: MesDisponible[];
  onCambiar: (filtros: Filtros) => void;
  onElegirMes: (periodo: string) => void;
  onCerrar: () => void;
}) {
  const opciones = opcionesDeFiltro(movimientos);
  const resultado = totalizar(filtrar(movimientos, filtros));

  const alternarCategoria = (categoria: Categoria) => {
    const activa = filtros.categorias.includes(categoria);
    onCambiar({
      ...filtros,
      categorias: activa
        ? filtros.categorias.filter((c) => c !== categoria)
        : [...filtros.categorias, categoria],
    });
  };

  const alternarCuenta = (cuenta: string | null) => {
    const activa = filtros.cuentas.includes(cuenta);
    onCambiar({
      ...filtros,
      cuentas: activa ? filtros.cuentas.filter((c) => c !== cuenta) : [...filtros.cuentas, cuenta],
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Cerrar filtros"
        onClick={onCerrar}
        className="absolute inset-0 cursor-default bg-canopy-to/40"
      />

      <div className="relative flex max-h-[88%] flex-col rounded-t-[28px] bg-card shadow-sheet">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <button
            type="button"
            onClick={() => onCambiar(SIN_FILTROS)}
            className="text-body-md text-ink-muted"
          >
            Limpiar
          </button>
          <h2 className="text-headline-sm">Filtros</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid size-7 place-items-center rounded-full bg-ground text-ink-muted"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <p className="mt-2 mb-2 text-label-caps text-ink-faint uppercase">Periodo</p>
          <div className="flex flex-wrap gap-2">
            {meses.map((m) => (
              <button
                key={m.periodo}
                type="button"
                onClick={() => onElegirMes(m.periodo)}
                className={`flex items-center gap-2 rounded-chip border px-3 py-1.5 text-body-md ${
                  m.periodo === periodo
                    ? 'border-canopy-to bg-canopy-to text-mint'
                    : 'border-hairline text-ink-muted'
                }`}
              >
                {etiquetaDeMes(m.periodo)}
                <span className="font-mono text-label-tabular opacity-70">{m.movimientos}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 mb-2 text-label-caps text-ink-faint uppercase">Categorías</p>
          <div className="flex flex-wrap gap-2">
            {opciones.categorias.map((o) => {
              const activa = filtros.categorias.includes(o.categoria);
              return (
                <button
                  key={o.categoria}
                  type="button"
                  onClick={() => alternarCategoria(o.categoria)}
                  className={`flex items-center gap-2 rounded-chip border px-3 py-1.5 text-body-md ${
                    activa
                      ? 'border-canopy-to bg-canopy-to text-mint'
                      : 'border-hairline text-ink-muted'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${estiloDe(o.categoria).barra}`} />
                  {o.categoria}
                  <span className="font-mono text-label-tabular opacity-70">{o.movimientos}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-5 mb-2 text-label-caps text-ink-faint uppercase">Cuentas</p>
          <div className="flex flex-wrap gap-2">
            {opciones.cuentas.map((o) => {
              const activa = filtros.cuentas.includes(o.cuenta);
              return (
                <button
                  key={nombreDeCuenta(o.cuenta)}
                  type="button"
                  onClick={() => alternarCuenta(o.cuenta)}
                  className={`flex items-center gap-2 rounded-chip border px-3 py-1.5 text-body-md ${
                    activa
                      ? 'border-canopy-to bg-canopy-to text-mint'
                      : 'border-hairline text-ink-muted'
                  }`}
                >
                  {nombreDeCuenta(o.cuenta)}
                  <span className="font-mono text-label-tabular opacity-70">{o.movimientos}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-hairline px-5 py-4">
          <button
            type="button"
            onClick={onCerrar}
            className="h-12 w-full rounded-control bg-jade text-body-lg font-semibold text-white"
          >
            {resultado.movimientos === 1
              ? 'Ver 1 movimiento'
              : `Ver ${resultado.movimientos} movimientos`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Movimientos({
  movimientos,
  gastoDelMes,
  filtros,
  periodo,
  meses,
  onCambiarFiltros,
  onElegirMes,
  onVolver,
  onAbrirMovimiento,
}: {
  movimientos: Movimiento[];
  /** Gasto del mes completo, para el porcentaje de la tarjeta de categoría. */
  gastoDelMes: number;
  filtros: Filtros;
  periodo: string;
  meses: MesDisponible[];
  onCambiarFiltros: (filtros: Filtros) => void;
  onElegirMes: (periodo: string) => void;
  onVolver: () => void;
  onAbrirMovimiento: (id: string) => void;
}) {
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const visibles = filtrar(movimientos, filtros);
  const totales = totalizar(visibles);
  const grupos = agruparPorDia(visibles);
  const activos = filtrosActivos(filtros);

  // La tarjeta de categoría solo aparece cuando el filtro deja una sola.
  const unicaCategoria = filtros.categorias.length === 1 ? filtros.categorias[0] : undefined;
  const estiloUnica = unicaCategoria === undefined ? null : estiloDe(unicaCategoria);

  return (
    <div className="relative flex min-h-full flex-col">
      <header className="flex h-14 items-center justify-between gap-3 bg-ground px-4">
        <button
          type="button"
          onClick={onVolver}
          aria-label="Volver"
          className="grid size-9 place-items-center rounded-full text-headline-md"
        >
          ←
        </button>
        <h1 className="text-headline-sm">Movimientos</h1>
        <button
          type="button"
          onClick={() => setBuscando((v) => !v)}
          aria-label="Buscar por concepto"
          aria-expanded={buscando}
          className="grid size-9 place-items-center rounded-full text-headline-md"
        >
          ⌕
        </button>
      </header>

      {buscando && (
        <div className="px-4 pb-2">
          <input
            type="search"
            autoFocus
            value={filtros.texto}
            onChange={(e) => onCambiarFiltros({ ...filtros, texto: e.target.value })}
            placeholder="Buscar por concepto"
            className="h-12 w-full rounded-control border border-hairline bg-card px-4 text-body-md outline-none placeholder:text-ink-faint focus:border-jade"
          />
        </div>
      )}

      {/* Barra de filtros: el botón y solo las píldoras activas */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <button
          type="button"
          onClick={() => setPanelAbierto(true)}
          className="flex items-center gap-2 rounded-full border border-hairline bg-card px-3.5 py-2 text-body-md"
        >
          Filtros
          {activos > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-jade font-mono text-[10px] text-white">
              {activos}
            </span>
          )}
        </button>

        <span className="flex items-center gap-1.5 rounded-full bg-canopy-to px-3.5 py-2 text-body-md text-mint">
          {etiquetaDeMes(periodo)}
        </span>

        {filtros.categorias.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() =>
              onCambiarFiltros({
                ...filtros,
                categorias: filtros.categorias.filter((x) => x !== c),
              })
            }
            className="flex items-center gap-1.5 rounded-full bg-canopy-to px-3.5 py-2 text-body-md text-mint"
          >
            {c} <span aria-hidden>✕</span>
          </button>
        ))}

        {filtros.cuentas.map((c) => (
          <button
            key={nombreDeCuenta(c)}
            type="button"
            onClick={() =>
              onCambiarFiltros({ ...filtros, cuentas: filtros.cuentas.filter((x) => x !== c) })
            }
            className="flex items-center gap-1.5 rounded-full bg-canopy-to px-3.5 py-2 text-body-md text-mint"
          >
            {nombreDeCuenta(c)} <span aria-hidden>✕</span>
          </button>
        ))}
      </div>

      {/* Tarjeta de la categoría filtrada */}
      {unicaCategoria !== undefined && estiloUnica !== null && (
        <section className="card mx-4 mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-full ${estiloUnica.fondo} ${estiloUnica.texto}`}
            >
              {estiloUnica.icono}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-headline-md">{unicaCategoria}</span>
              <span className="text-body-sm text-ink-faint">
                {totales.cuentan} de {totales.movimientos} movimientos cuentan
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="font-mono text-amount-md">
              {formatearMXN(totales.gastoCentavos)}
            </span>
            <span className="text-body-sm text-ink-faint">
              {gastoDelMes === 0
                ? '—'
                : `${Math.round((totales.gastoCentavos / gastoDelMes) * 100)}% de tu gasto`}
            </span>
          </div>
        </section>
      )}

      {/* Línea de resultados */}
      <p className="px-4 pb-3 text-body-md text-ink-faint">
        <span className="font-mono font-bold text-ink">{totales.movimientos}</span> movimientos ·{' '}
        <span className="font-mono font-bold text-jade">{totales.cuentan}</span> cuentan ·{' '}
        <span className="font-mono font-bold text-ink">{formatearMXN(totales.gastoCentavos)}</span>
      </p>

      {grupos.length === 0 ? (
        <p className="px-4 py-8 text-center text-body-md text-ink-muted">
          Ningún movimiento coincide con estos filtros.
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-8">
          {grupos.map((g) => (
            <section key={g.dia}>
              <div className="flex items-baseline justify-between gap-3 pb-2">
                <h2 className="text-label-caps text-ink-faint uppercase">
                  {etiquetaDeDia(g.dia)}
                </h2>
                <span className="font-mono text-label-tabular text-ink-faint">
                  {formatearMXN(g.centavos)}
                </span>
              </div>
              <div className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-card">
                {g.movimientos.map((m) => (
                  <Fila key={m.id} movimiento={m} onAbrir={onAbrirMovimiento} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {panelAbierto && (
        <PanelFiltros
          movimientos={movimientos}
          filtros={filtros}
          periodo={periodo}
          meses={meses}
          onCambiar={onCambiarFiltros}
          onElegirMes={onElegirMes}
          onCerrar={() => setPanelAbierto(false)}
        />
      )}
    </div>
  );
}
