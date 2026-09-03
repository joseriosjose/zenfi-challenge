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
