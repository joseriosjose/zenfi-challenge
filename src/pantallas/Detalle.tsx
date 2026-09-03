/**
 * Detalle de un movimiento. Aqui vive el requisito #2: corregir la categoria,
 * y con ella todo lo demas que el banco pudo mandar mal.
 *
 * La pantalla es un borrador: se edita en local y se guarda de una vez. Un
 * importe se escribe caracter por caracter y no tendria sentido recalcular el
 * mes en cada tecla; guardar de golpe tambien hace que "restaurar" sea una
 * sola operacion y no seis.
 *
 * El registro del banco nunca se toca. Todo lo de aqui es una capa encima que
 * se puede quitar entera.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { CATEGORIAS, MONEDA_BASE, formatearMonto } from '../dominio/modelo';
import type { Categoria } from '../dominio/modelo';
import type { AjusteMovimiento, Movimiento } from '../dominio/derivar';
import type { TipoMovimiento } from '../dominio/reglas';
import { estiloDe } from '../ui/categorias';
import { Hoja } from '../ui/Hoja';

/**
 * Un mapa por enum. Cada origen se explica una sola vez y con su evidencia:
 * quien puso la categoria y con que la puso.
 *
 * `banco` es el unico `null` — que el banco mande una categoria y la
 * respetemos no es noticia, y anunciarlo enterraria los casos que si lo son.
 */
const ORIGEN: Record<
  Movimiento['origenCategoria'],
  {
    titulo: string;
    insignia: string;
    encabezado: (m: Movimiento) => string;
    explicacion: (m: Movimiento) => string;
  } | null
> = {
  banco: null,
  consenso: {
    titulo: 'Ajustado por regla',
    insignia: 'Ajustado',
    encabezado: (m) => `Lo movimos a ${m.categoria}`,
    explicacion: (m) => `Tus otros ${m.apoyos} cargos de ${m.comercio} están en ${m.categoria}.`,
  },
  catalogo: {
    titulo: 'Sugerida por nosotros',
    insignia: 'Sugerida',
    encabezado: (m) => `Lo pusimos en ${m.categoria}`,
    explicacion: (m) =>
      `${m.comercio} aparece una sola vez, así que no hay con qué deducirla. Esta la pusimos nosotros.`,
  },
  usuario: {
    titulo: 'Corregida por ti',
    insignia: 'Tuya',
    encabezado: (m) => `Tú lo pusiste en ${m.categoria}`,
    explicacion: () => 'Tu corrección manda sobre cualquier regla.',
  },
  'sin-match': {
    titulo: 'Sin identificar',
    insignia: 'Sin match',
    encabezado: () => 'No pudimos identificar el comercio',
    explicacion: () => 'Preferimos dejarla vacía antes que adivinarla. Elígela tú.',
  },
};

/** Un mapa por enum. El orden es el de la cuadricula, de lo comun a lo raro. */
const TIPOS = [
  { valor: 'gasto', etiqueta: 'Gasto' },
  { valor: 'ingreso', etiqueta: 'Ingreso' },
  { valor: 'traspaso', etiqueta: 'Traspaso' },
  { valor: 'reembolso', etiqueta: 'Reembolso' },
] as const satisfies readonly { valor: TipoMovimiento; etiqueta: string }[];

function fechaLarga(fecha: Date): string {
  return fecha.toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ------------------------------------------------------------------ */

function Etiqueta({ texto }: { texto: string }) {
  return <p className="px-1 pt-4 pb-2 text-label-caps text-ink-faint uppercase">{texto}</p>;
}

function Renglon({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="flex min-w-0 flex-col">
        <span className="text-body-md font-semibold">{titulo}</span>
        <span className="text-body-sm text-ink-faint">{ayuda}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2">{children}</span>
    </div>
  );
}

function Segmentado<T extends string>({
  opciones,
  valor,
  onElegir,
}: {
  opciones: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onElegir: (valor: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-control bg-ground p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onElegir(o.valor)}
          className={`h-9 rounded-[9px] text-body-md font-semibold ${
            o.valor === valor ? 'bg-canopy-to text-mint' : 'text-ink-muted'
          }`}
        >
          {o.etiqueta}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function HojaCategoria({
  elegida,
  categoriaBanco,
  onElegir,
  onCerrar,
}: {
  elegida: Categoria;
  categoriaBanco: Categoria | null;
  onElegir: (categoria: Categoria) => void;
  onCerrar: () => void;
}) {
  const cambiada = categoriaBanco !== null && categoriaBanco !== elegida;

  return (
    <Hoja etiquetaCerrar="Cerrar categorías" onCerrar={onCerrar}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <span className="w-16 text-body-md text-ink-muted">Categoría</span>
        <span className="h-1 w-9 rounded-full bg-hairline" />
        <button
          type="button"
          onClick={onCerrar}
          className="w-16 text-right text-body-md font-semibold text-jade"
        >
          Listo
        </button>
      </div>

      {/* Lo que mando el banco, siempre a la vista y siempre reversible. */}
      {categoriaBanco !== null && (
        <div className="flex items-center justify-between gap-3 border-y border-hairline bg-ground px-5 py-2.5">
          <span className="truncate text-body-sm text-ink-muted">
            Tu banco la envió como <span className="font-semibold text-ink">{categoriaBanco}</span>
          </span>
          {cambiada && (
            <button
              type="button"
              onClick={() => onElegir(categoriaBanco)}
              className="shrink-0 text-body-sm font-semibold text-jade"
            >
              Usar la del banco
            </button>
          )}
        </div>
      )}

      <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-5">
        {CATEGORIAS.map((categoria) => {
          const activa = categoria === elegida;
          const estilo = estiloDe(categoria);
          return (
            <button
              key={categoria}
              type="button"
              onClick={() => onElegir(categoria)}
              className={`flex flex-col items-center gap-1.5 rounded-card border px-2 py-3 ${
                activa ? 'border-jade bg-jade/6' : 'border-hairline'
              }`}
            >
              <span
                className={`grid size-9 place-items-center rounded-full ${estilo.fondo} ${estilo.texto}`}
              >
                {estilo.icono}
              </span>
              <span
                className={`text-center text-body-sm leading-tight ${
                  activa ? 'font-semibold text-jade' : 'text-ink-muted'
                }`}
              >
                {categoria}
              </span>
              {categoria === categoriaBanco && (
                <span className="text-label-caps text-ink-faint uppercase">Del banco</span>
              )}
            </button>
          );
        })}
      </div>
    </Hoja>
  );
}

/* ------------------------------------------------------------------ */

export type DetalleProps = {
  movimiento: Movimiento;
  ajuste: AjusteMovimiento;
  onVolver: () => void;
  onAjustar: (id: string, cambio: Partial<AjusteMovimiento>) => void;
  onRestaurar: (id: string) => void;
};

export function Detalle({ movimiento, ajuste, onVolver, onAjustar, onRestaurar }: DetalleProps) {
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // El borrador arranca de lo que se ve hoy, no del ajuste: si una regla movio
  // la categoria, el campo debe mostrar esa y no un `null`.
  const [nombre, setNombre] = useState(movimiento.descripcion);
  const [nota, setNota] = useState(ajuste.nota ?? '');
  const [categoria, setCategoria] = useState<Categoria>(movimiento.categoria);
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo);
  const [pesos, setPesos] = useState((Math.abs(movimiento.centavos) / 100).toFixed(2));
  const [esCargo, setEsCargo] = useState(movimiento.centavos <= 0);
  const [tipoCambio, setTipoCambio] = useState(
    ajuste.tipoCambio === null ? '' : String(ajuste.tipoCambio),
  );

  const estilo = estiloDe(categoria);
  const origen = ORIGEN[movimiento.origenCategoria];
  const delBanco = movimiento.categoriaBanco;
  const otraMoneda = movimiento.original.moneda !== MONEDA_BASE;
  const moneda = movimiento.convertido ? MONEDA_BASE : movimiento.original.moneda;
  const tocado = Object.values(ajuste).some((valor) => valor !== null && valor !== false);

  const guardar = () => {
    const magnitud = Math.round(Number(pesos.replace(',', '.')) * 100);
    const tc = Number(tipoCambio.replace(',', '.'));

    const centavos = Number.isFinite(magnitud) ? (esCargo ? -magnitud : magnitud) : null;
    const reglas = movimiento.segunReglas;

    // Cada campo se guarda solo si difiere de lo que dijeron las reglas. Si
    // no, "guardar" sin tocar nada dejaria el movimiento marcado como
    // corregido y con el boton de restaurar activo para siempre.
    onAjustar(movimiento.id, {
      nombre: nombre.trim() === movimiento.original.descripcion ? null : nombre.trim(),
      nota: nota.trim() === '' ? null : nota.trim(),
      categoria: categoria === reglas.categoria ? null : categoria,
      centavos: centavos === null || centavos === reglas.centavos ? null : centavos,
      tipo: tipo === reglas.tipo ? null : tipo,
      tipoCambio: otraMoneda && Number.isFinite(tc) && tc > 0 ? tc : null,
    });
    onVolver();
  };

  return (
    <div className="pb-10">
      <header className="flex h-14 items-center justify-between gap-3 bg-ground px-4">
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVolver}
            className="grid size-9 place-items-center rounded-full text-headline-md"
            aria-label="Volver"
          >
            ←
          </button>
          <h1 className="text-headline-sm">Movimiento</h1>
        </span>
        <button type="button" onClick={guardar} className="text-body-md font-semibold text-jade">
          Guardar
        </button>
      </header>

      {/* Que es */}
      <section className="mx-4 flex items-center gap-3 rounded-card bg-card p-4 shadow-card">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-full ${estilo.fondo} ${estilo.texto}`}
        >
          {estilo.icono}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-lg font-semibold uppercase">{movimiento.descripcion}</p>
          <p className="mt-0.5 text-body-sm text-ink-faint">
            {fechaLarga(movimiento.fecha)}
            {movimiento.cuenta !== null ? ` · ${movimiento.cuenta}` : ' · Sin cuenta'}
          </p>
        </div>
        <p className="shrink-0 font-mono text-amount-sm font-semibold">
          {movimiento.centavos > 0 ? '+' : ''}
          {formatearMonto(movimiento.centavos, moneda)}
        </p>
      </section>

      {/* Por que no cuenta */}
      {movimiento.exclusion !== null && (
        <section className="mx-4 mt-3 rounded-card border-l-4 border-revisar bg-revisar/8 p-4">
          <p className="text-label-caps text-revisar uppercase">Por qué no cuenta</p>
          <p className="mt-1 text-headline-sm">{movimiento.exclusion.motivo}</p>
          <p className="mt-1 text-body-sm text-ink-muted">{movimiento.exclusion.detalle}</p>
          <button
            type="button"
            onClick={() => onAjustar(movimiento.id, { incluir: true })}
            className="mt-3 h-10 rounded-control bg-revisar px-4 text-body-md font-semibold text-white"
          >
            Contarlo de todos modos
          </button>
          <p className="mt-2 text-body-sm text-ink-faint">
            Lo decidió la regla {movimiento.exclusion.regla}.
          </p>
        </section>
      )}

      {/* Que le hicimos a la categoria y con que evidencia */}
      {origen !== null && (
        <section className="mx-4 mt-3 rounded-card border-l-4 border-jade bg-jade/6 p-4">
          <p className="text-label-caps text-jade uppercase">{origen.titulo}</p>
          <p className="mt-1 text-headline-sm">{origen.encabezado(movimiento)}</p>
          <p className="mt-1 text-body-sm text-ink-muted">{origen.explicacion(movimiento)}</p>
          {delBanco !== null && delBanco !== categoria && (
            <button
              type="button"
              onClick={() => setCategoria(delBanco)}
              className="mt-3 h-10 rounded-control border border-jade px-4 text-body-md font-semibold text-jade"
            >
              Usar {delBanco}
            </button>
          )}
        </section>
      )}

      <section className="mx-4">
        <Etiqueta texto="Cómo se ve" />
        <div className="divide-y divide-hairline rounded-card bg-card shadow-card">
          <Renglon titulo="Nombre" ayuda="Ponle el nombre con el que tú lo reconoces">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-label="Nombre del movimiento"
              className="w-40 bg-transparent text-right text-body-md uppercase outline-none"
            />
          </Renglon>

          <button
            type="button"
            onClick={() => setHojaAbierta(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          >
            <span className="flex flex-col">
              <span className="text-body-md font-semibold">Categoría</span>
              <span className="text-body-sm text-ink-faint">Tócala para cambiarla</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={`size-2 rounded-full ${estilo.barra}`} />
              <span className="text-body-md">{categoria}</span>
              {origen !== null && categoria === movimiento.categoria && (
                <span className="rounded-[4px] bg-jade/12 px-1.5 py-0.5 text-label-caps text-jade uppercase">
                  {origen.insignia}
                </span>
              )}
              <span className="text-ink-faint">›</span>
            </span>
          </button>

          <Renglon titulo="Nota" ayuda="Para acordarte de qué fue">
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Agregar una nota"
              aria-label="Nota"
              className="w-40 bg-transparent text-right text-body-md italic outline-none placeholder:text-ink-faint"
            />
          </Renglon>
        </div>
      </section>

      <section className="mx-4">
        <Etiqueta texto="Cuánto" />
        <div className="rounded-card bg-card p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body-md font-semibold">Importe</span>
            <span className="flex items-baseline gap-1.5 rounded-chip bg-ground px-3 py-1.5">
              <span className="font-mono text-body-md">{esCargo ? '−' : '+'}</span>
              <input
                value={pesos}
                onChange={(e) => setPesos(e.target.value)}
                inputMode="decimal"
                aria-label="Importe"
                className="w-24 bg-transparent text-right font-mono text-body-md outline-none"
              />
              <span className="font-mono text-label-tabular text-ink-faint">{moneda}</span>
            </span>
          </div>

          <div className="mt-3">
            <Segmentado
              opciones={[
                { valor: 'cargo', etiqueta: 'Cargo' },
                { valor: 'abono', etiqueta: 'Abono' },
              ]}
              valor={esCargo ? 'cargo' : 'abono'}
              onElegir={(v) => setEsCargo(v === 'cargo')}
            />
          </div>

          {/* El campo solo se habilita donde hay algo que resolver: R09. */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-hairline pt-3">
            <span className="flex flex-col">
              <span className={`text-body-md ${otraMoneda ? 'font-semibold' : 'text-ink-faint'}`}>
                Tipo de cambio
              </span>
              <span className="text-body-sm text-ink-faint">
                {otraMoneda
                  ? `Cuántos pesos costaba un ${movimiento.original.moneda} ese día`
                  : 'Solo aplica a movimientos en otra moneda.'}
              </span>
            </span>
            {otraMoneda ? (
              <input
                value={tipoCambio}
                onChange={(e) => setTipoCambio(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                aria-label="Tipo de cambio"
                className="w-24 shrink-0 rounded-chip bg-ground px-3 py-1.5 text-right font-mono text-body-md outline-none"
              />
            ) : (
              <span className="text-ink-faint">—</span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-4">
        <Etiqueta texto="Cómo cuenta" />
        <div className="rounded-card bg-card p-4 shadow-card">
          <p className="pb-3 text-body-md font-semibold">Tipo de movimiento</p>
          <Segmentado opciones={TIPOS} valor={tipo} onElegir={setTipo} />
          <p className="pt-3 text-body-sm text-ink-faint">
            Los traspasos no cuentan como gasto del mes. Los reembolsos se restan de su categoría.
          </p>
        </div>
      </section>

      <div className="mt-6 px-4">
        <button
          type="button"
          onClick={guardar}
          className="h-13 w-full rounded-control bg-canopy-to text-body-lg font-semibold text-white"
        >
          Guardar ajustes
        </button>
        <button
          type="button"
          onClick={() => {
            onRestaurar(movimiento.id);
            onVolver();
          }}
          disabled={!tocado}
          className="mt-3 h-10 w-full text-body-md text-ink-faint disabled:opacity-40"
        >
          Restaurar todo lo que envió el banco
        </button>
      </div>

      {hojaAbierta && (
        <HojaCategoria
          elegida={categoria}
          categoriaBanco={delBanco}
          onElegir={(elegida) => {
            setCategoria(elegida);
            setHojaAbierta(false);
          }}
          onCerrar={() => setHojaAbierta(false)}
        />
      )}
    </div>
  );
}
