# CLAUDE.md

Reto técnico Zenfi — React 19 + TypeScript + Vite 8 + Tailwind v4.
Comandos: `pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm typecheck`.

## TypeScript de verdad, no `any` decorativo

La mitad mecánica de esta regla está en `eslint.config.js` y falla el build:
`any`, `as X`, `!` y `@ts-expect-error` sin descripción son **error**, no
warning. `as const` y `satisfies` siguen permitidos a propósito.
`strict` y `noUncheckedIndexedAccess` ya están activos en `tsconfig.app.json`.

Si el compilador se queja, el tipo está mal — no el compilador. Lo de abajo
es lo que el linter **no** puede juzgar y por eso vive aquí.

### Normaliza en la frontera, no en el punto de uso

`src/data/movimientos.json` viene sucio y sin tipar. Toda la limpieza pasa
una vez, al entrar; de ahí para adentro los tipos son verdad.

```ts
// ❌ mentira: el JSON no garantiza nada de esto
const movs = raw.movimientos as Movimiento[];

// ✅ una función que valida, descarta o repara, y devuelve el tipo
function parseMovimiento(raw: unknown): Movimiento | null { ... }
```

Los renglones que no pasan **se cuentan y se reportan en la UI**. Que un dato
malo desaparezca en silencio es peor que el `any`: el `any` al menos se ve.

Dentro de un type guard sí cabe una aserción, porque está respaldada por los
checks que acabas de hacer. Va con desactivación puntual del linter y el
motivo escrito — que sea visible es justamente el punto.

### Modela estados imposibles fuera de existencia

- Lo mutuamente excluyente va en unión discriminada, no en booleanos
  opcionales que permiten combinaciones que no existen:
  `type Estado = { tipo: 'cargando' } | { tipo: 'listo'; datos: Movimiento[] }`
- Lo que puede faltar es `| null`, no un `?` puesto para que compile.
- Si existe el tipo del dominio, úsalo: `(id: MovimientoId) => void`, no
  `(id: string) => void`.

### Componentes

- Props en un `type` exportado y con nombre. Nada de `React.FC`.
- Clases de Tailwind siempre literales: el escaneo es de texto plano, así que
  `` `bg-${color}-600` `` no genera nada. Usa un mapa de clases completas.

## Arquitectura de componentes

Las capas se separan por **qué tiene derecho a saber cada una**, no por tamaño.
No clasifiques por átomo/molécula/organismo: esa taxonomía no converge.

**Los props dicen la capa.** Se revisa leyendo la firma, sin abrir el cuerpo:

| Props | Capa | No puede |
|---|---|---|
| `string`, `number`, `boolean`, `children` | Primitivo | Nombrar una entidad del negocio |
| Un objeto del modelo (`movimiento`, `item`) | Dominio (UI) | Hooks, tocar la fuente, calcular |
| Ninguno, o parámetros de ruta | Pantalla | Calcular lo que toca al dominio |

Las funciones de negocio puras no son UI y no importan nada de UI.

1. **Una sola puerta a la fuente.** `movimientos.json` se importa en un lugar;
   el resto recibe el resultado ya normalizado.
2. **El modelo entra completo:** `<Fila movimiento={m} />`, no desarmado en
   props sueltos.
3. **Un mapa por enum, en un archivo.** Nunca un `switch` repartido.
4. **Composición, no configuración.** `children` en vez de una lista más un
   flag. Un prop que cambia la *estructura* son dos componentes disfrazados
   de uno; uno que solo cambia color o tamaño está bien.
5. **Lo derivado se deriva**, no se guarda en estado.
6. **Agregar es dominio.** Si escribes un `if` o una aritmética sobre un valor
   de negocio dentro de un componente, esa línea está en la capa equivocada.

Un primitivo se crea cuando **la segunda** pantalla lo pide, no antes.
Nada de `memo`/`useCallback` preventivo ni carpetas `hooks/` `utils/` `types/`.

Racional completo, anti-patrones y prueba de aislamiento: `docs/ARQUITECTURA.md`.
