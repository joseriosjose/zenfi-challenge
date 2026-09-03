/**
 * Navegacion entre las pantallas y el unico estado de la app: los ajustes del
 * usuario. Todo lo derivado se recalcula, no se guarda (regla 5).
 */
import { useMemo, useState } from 'react';
import { AJUSTE_VACIO, AJUSTES_VACIOS, ajusteVacio, calendario, derivar } from './dominio/derivar';
import type { AjusteMovimiento, AjustesUsuario } from './dominio/derivar';
import { conciliar } from './dominio/conciliacion';
import { resumir } from './dominio/resumen';
import { SIN_FILTROS } from './dominio/lista';
import type { Filtros } from './dominio/lista';
import { MarcoDispositivo } from './ui/MarcoDispositivo';
import { Resumen } from './pantallas/Resumen';
import { Detalle } from './pantallas/Detalle';
import { Movimientos } from './pantallas/Movimientos';
import { Excluidos } from './pantallas/Excluidos';
import { etiquetaDeMes } from './ui/fechas';

type Origen = 'resumen' | 'movimientos' | 'excluidos';

type Vista =
  | { nombre: 'resumen' }
  | { nombre: 'movimientos' }
  | { nombre: 'excluidos' }
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
  const conciliacion = useMemo(() => conciliar(periodo), [periodo]);

  /**
   * La unica escritura de la app. Un ajuste que no cambia nada se borra en vez
   * de guardarse vacio: asi "restaurar" y "nunca lo toque" son el mismo
   * estado, y no hay dos formas de representar lo mismo.
   */
  const ajustar = (id: string, cambio: Partial<AjusteMovimiento>) => {
    setAjustes((previo) => {
      const fusionado: AjusteMovimiento = { ...(previo[id] ?? AJUSTE_VACIO), ...cambio };
      const resto = Object.fromEntries(
        Object.entries(previo).filter(([clave]) => clave !== id),
      );
      return ajusteVacio(fusionado) ? resto : { ...resto, [id]: fusionado };
    });
  };

  /** Descarta todas las correcciones de un movimiento de una sola vez. */
  const restaurar = (id: string) => {
    setAjustes((previo) =>
      Object.fromEntries(Object.entries(previo).filter(([clave]) => clave !== id)),
    );
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
          onVerExcluidos={() => setVista({ nombre: 'excluidos' })}
        />
      )}

      {vista.nombre === 'excluidos' && (
        <Excluidos
          conciliacion={conciliacion}
          nombreDelMes={etiquetaDeMes(periodo.periodo)}
          onVolver={() => setVista({ nombre: 'resumen' })}
          onAbrirMovimiento={(id) => setVista({ nombre: 'detalle', id, origen: 'excluidos' })}
          onIncluir={(id) => ajustar(id, { incluir: true })}
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
          ajuste={ajustes[vista.id] ?? AJUSTE_VACIO}
          onAjustar={ajustar}
          onRestaurar={restaurar}
        />
      )}
    </MarcoDispositivo>
  );
};

export default App;
