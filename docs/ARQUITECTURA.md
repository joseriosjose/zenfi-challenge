# Regla — Arquitectura de componentes

Aplicable a cualquier front que consuma datos y los pinte. Independiente del framework,
del diseño y del dominio.

---

## Principio

Las capas se separan por **qué tiene derecho a saber cada una**, no por tamaño ni por
complejidad visual. Un botón y una tabla pueden vivir en la misma capa; una tabla y otra
tabla pueden vivir en capas distintas.

Taxonomías por tamaño (átomo / molécula / organismo) no se resuelven solas: dos personas
clasifican el mismo componente distinto y la discusión no produce nada. "¿Qué sabe este
componente?" tiene una sola respuesta.

---

## Las cuatro capas

| Capa | Sabe de | Puede | No puede |
|---|---|---|---|
| **Dominio** (no es UI) | Las reglas de negocio | Ser funciones puras, testeables sin montar nada | Importar nada de UI |
| **Primitivos** | Los tokens de diseño | Recibir valores sueltos y `children` | Nombrar una entidad del negocio |
| **Componentes de dominio** | La forma de UN modelo | Leer ese modelo y pintarlo | Usar hooks, tocar la fuente de datos, calcular |
| **Pantallas** | Estado, hooks, navegación | Componer, filtrar, orquestar | Calcular algo que le toca al dominio |

El flujo es de una sola dirección y no se salta capas:

```
fuente de datos  ──►  dominio  ──►  pantalla  ──►  dominio(UI)  ──►  primitivos
                     (funciones)              (composición)
```

---

## El criterio verificable

**Los props de un componente dicen en qué capa vive.**

| Si sus props son… | Está en… |
|---|---|
| `string`, `number`, `boolean`, `color`, `children` | Primitivos |
| Un objeto del modelo (`modelo`, `item`, `entidad`) | Dominio |
| Ninguno, o parámetros de ruta | Pantallas |

Un primitivo que recibe un objeto del modelo subió de capa sin darse cuenta: ya no se
puede reusar fuera de este dominio. Una pantalla que recibe datos por props bajó: ya no
es una pantalla, es un componente de dominio grande.

Esto se revisa leyendo la firma. No hace falta abrir el cuerpo.

---

## Las seis reglas

### 1. Un solo punto de entrada conoce la fuente

La fuente de datos (fetch, archivo, SDK, store) se importa en **un solo lugar**. Todo lo
demás recibe el resultado.

```bash
# debe devolver exactamente un archivo fuera de la capa de dominio
grep -rl "<fuente>\|<funcionDeDominio>" src/ | grep -v "^src/dominio/"
```

Si devuelve más de uno, la arquitectura ya se rompió. Es la única regla que se puede
automatizar; en este repo se revisa a mano corriendo el grep.

### 2. El modelo entra completo, no desarmado

```jsx
<FilaEntidad modelo={item.modelo} />                    // sí
<FilaEntidad titulo={} valor={} estado={} icono={} />   // no
```

Desarmar el modelo en props sueltos multiplica los sitios que hay que tocar cuando el
contrato gana un campo, y esconde el acoplamiento: ese componente **sí** depende del
contrato, y conviene que se vea en su firma.

### 3. Un mapa por enum, en un archivo

Cada enum del modelo se traduce a estilo, ícono o texto **una sola vez**, como tabla, no
como `switch` repartido:

```js
const ESTILO_POR_ESTADO = {
  a: { color: 'var(--x)', fondo: 'var(--x-8)' },
  b: { color: 'var(--y)', fondo: 'var(--y-8)' },
}
```

Un `switch` duplicado en dos componentes diverge en el tercer sprint. Una tabla no puede.

### 4. Composición, no configuración

Un contenedor recibe `children`, no una lista más un flag que cambia cómo la pinta.

```jsx
<Grupo titulo={t} total={n}>{items.map(...)}</Grupo>     // sí
<Grupo items={items} tipo="variante-b" />                // no
```

Un componente con un prop `tipo` o `variante` que le cambia la **estructura interna** son
dos componentes disfrazados de uno. Un prop que solo cambia color o tamaño está bien.

### 5. Lo derivado se deriva, no se guarda

Lo que se puede calcular desde el estado no vive en el estado. Se calcula al renderizar,
memoizado si hace falta.

```jsx
const modelo = useMemo(() => derivar(fuente, ajustes), [fuente, ajustes])
```

Guardar un derivado en estado crea una segunda copia de la verdad que se hace stale sola.
Es el bug que no se ve hasta producción.

### 6. Agregar es dominio, no pantalla

Contar, sumar, promediar y formatear son operaciones de negocio aunque se muestren en un
encabezado. Si una pantalla hace `.reduce()` sobre datos o `.toFixed(2)`, esa línea va en
la capa de dominio y la pantalla la llama.

Regla operativa: **si escribes un `if` o una aritmética sobre un valor de negocio dentro
de un componente, esa línea está en la capa equivocada.**

---

## Estado

- **Global solo lo que dos pantallas comparten.** Si lo usa una, es local de esa pantalla.
- **Lo derivado no es estado** (regla 5).
- No metas una librería de estado hasta que el paso de props duela de verdad. En una app
  chica, `useState` en la raíz alcanza; el costo de sacarla después es bajo, el de meterla
  antes de tiempo no.

---

## Cuándo crear un primitivo

Cuando **la segunda** pantalla lo pida. No antes.

Un primitivo escrito para un solo uso es una abstracción sin evidencia: adivinaste sus
puntos de variación y casi siempre le sobran props. Si solo lo usa una pantalla, vive
dentro de esa pantalla hasta que alguien más lo necesite.

---

## Anti-patrones

| Anti-patrón | Por qué |
|---|---|
| Clasificar por tamaño (átomo/molécula/organismo) | La taxonomía no converge y la discusión no produce código |
| Un componente por elemento de texto (`<Texto variante="cuerpo-md" />`) | Indirección que no paga; los tokens y las clases ya lo resuelven |
| Barril de primitivos genéricos escrito por adelantado | Abstracciones sin evidencia de uso |
| `memo` / `useCallback` de entrada | Optimización sin medición; añade ruido y bugs de dependencias |
| Un `context` por dominio en una app chica | Complejidad de infraestructura sin problema que la justifique |
| Carpetas por tipo de archivo (`hooks/`, `utils/`, `types/`) | Rompe la localidad: para entender una feature abres cinco carpetas |

---

## Cómo se verifica

**Con el grep de la regla 1**, corriéndolo a mano antes de entregar.

**En code review, cuatro preguntas:**

1. ¿Los props de este componente corresponden a su capa?
2. ¿Hay algún `if` o aritmética sobre un valor de negocio dentro de un componente?
3. ¿Algún prop `tipo`/`variante` le cambia la estructura interna, no solo el estilo?
4. ¿Se guardó en estado algo que se podía derivar?

**La prueba de aislamiento.** Toma cualquier componente de dominio y renderízalo pasándole
un objeto del modelo escrito a mano, sin importar la fuente de datos y sin montar una
pantalla. Si para que se viera correcto necesitaste pasarle algo extra, hay lógica de
negocio escondida adentro.
