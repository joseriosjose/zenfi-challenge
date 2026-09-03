/**
 * Navegacion entre las dos vistas y el unico estado de la app: los ajustes
 * del usuario. Todo lo derivado se recalcula, no se guarda (regla 5).
 */
import { useMemo, useState } from 'react';
import { AJUSTES_VACIOS, calendario, derivar } from './dominio/derivar';
import type { AjustesUsuario } from './dominio/derivar';
import type { Categoria } from './dominio/modelo';
import { resumir } from './dominio/resumen';
import { MarcoDispositivo } from './ui/MarcoDispositivo';
import { Resumen } from './pantallas/Resumen';
import { Detalle } from './pantallas/Detalle';

type Vista = { nombre: 'resumen' } | { nombre: 'detalle'; id: string };

const App = () => {
  const meses = useMemo(() => calendario(), []);
  const [ajustes, setAjustes] = useState<AjustesUsuario>(AJUSTES_VACIOS);
  const [mes, setMes] = useState(meses.declarado);
  const [vista, setVista] = useState<Vista>({ nombre: 'resumen' });

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

  return (
    <MarcoDispositivo vista={vista.nombre === 'detalle' ? vista.id : 'resumen'}>
      {seleccionado === null ? (
        <Resumen
          resumen={resumen}
          periodo={periodo.periodo}
          meses={meses.meses}
          onElegirMes={setMes}
          onAbrirMovimiento={(id) => setVista({ nombre: 'detalle', id })}
        />
      ) : (
        <Detalle
          movimiento={seleccionado}
          onVolver={() => setVista({ nombre: 'resumen' })}
          onCambiarCategoria={cambiarCategoria}
          onIncluir={incluir}
        />
      )}
    </MarcoDispositivo>
  );
};

export default App;
