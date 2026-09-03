/**
 * Navegacion entre las dos vistas y el unico estado de la app: los ajustes
 * del usuario. Todo lo derivado se recalcula, no se guarda (regla 5).
 */
import { useMemo, useState } from 'react';
import { AJUSTES_VACIOS, calendario, derivar } from './dominio/derivar';
import type { AjustesUsuario } from './dominio/derivar';
import type { Categoria } from './dominio/modelo';
import { resumir } from './dominio/resumen';
import { SIN_FILTROS } from './dominio/lista';
import type { Filtros } from './dominio/lista';
import { MarcoDispositivo } from './ui/MarcoDispositivo';
import { Resumen } from './pantallas/Resumen';
import { Detalle } from './pantallas/Detalle';
import { Movimientos } from './pantallas/Movimientos';

type Origen = 'resumen' | 'movimientos';

type Vista =
  | { nombre: 'resumen' }
  | { nombre: 'movimientos' }
  /** Recuerda de donde vino para que el boton de volver regrese ahi. */
  | { nombre: 'detalle'; id: string; origen: Origen };

const App = () => {
  const meses = useMemo(() => calendario(), []);
  const [ajustes, setAjustes] = useState<AjustesUsuario>(AJUSTES_VACIOS);
  const [mes, setMes] = useState(meses.declarado);
  const [vista, setVista] = useState<Vista>({ nombre: 'resumen' });
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);

  const periodo = useMemo(() => derivar(ajustes, mes), [ajustes, mes]);
  const resumen = useMemo(() => resumir(periodo), [periodo]);

  const cambiarCategoria = (id: string, categoria: Categoria) => {
    setAjustes((previo) => ({
      ...previo,
      categorias: { ...previo.categorias, [id]: categoria },
    }));
  };

  const incluir = (id: string) => {
    setAjustes((previo) => ({ ...previo, incluir: { ...previo.incluir, [id]: true } }));
  };

  const seleccionado =
    vista.nombre === 'detalle'
      ? periodo.movimientos.find((m) => m.id === vista.id) ?? null
      : null;

  const elegirMes = (nuevo: string) => {
    setMes(nuevo);
    // Los filtros son del mes que se estaba viendo: cambiar de mes los limpia.
    setFiltros(SIN_FILTROS);
  };

  return (
    <MarcoDispositivo vista={vista.nombre === 'detalle' ? vista.id : vista.nombre}>
      {vista.nombre === 'resumen' && (
        <Resumen
          resumen={resumen}
          periodo={periodo.periodo}
          meses={meses.meses}
          onElegirMes={elegirMes}
          onAbrirMovimiento={(id) => setVista({ nombre: 'detalle', id, origen: 'resumen' })}
          onVerTodos={() => setVista({ nombre: 'movimientos' })}
        />
      )}

      {vista.nombre === 'movimientos' && (
        <Movimientos
          movimientos={periodo.movimientos}
          gastoDelMes={resumen.gastoCentavos}
          filtros={filtros}
          periodo={periodo.periodo}
          meses={meses.meses}
          onCambiarFiltros={setFiltros}
          onElegirMes={elegirMes}
          onVolver={() => setVista({ nombre: 'resumen' })}
          onAbrirMovimiento={(id) => setVista({ nombre: 'detalle', id, origen: 'movimientos' })}
        />
      )}

      {vista.nombre === 'detalle' && seleccionado !== null && (
        <Detalle
          movimiento={seleccionado}
          onVolver={() => setVista({ nombre: vista.origen })}
          onCambiarCategoria={cambiarCategoria}
          onIncluir={incluir}
        />
      )}
    </MarcoDispositivo>
  );
};

export default App;
