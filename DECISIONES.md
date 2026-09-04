# Decisiones

## Qué muestro y qué dejo fuera

- **Resumen.** El gasto del mes y una frase que nombra dónde se te fue más: *"Más de la mitad se te fue en Vivienda"*.
- **Las categorías principales abren la lista ya filtrada.** La categoría es la pregunta; la lista, la respuesta.
- **Movimientos.** El mes agrupado por día, con el total del día sumando solo lo que cuenta. Filtros por categoría y cuenta, y búsqueda por concepto.
- **Conciliación mensual.** Lo que quedó fuera del resumen, agrupado por quién tiene que actuar: nadie, tú o el banco. Las reglas se divulgan ahí, en un solo lugar, no repartidas en seis flujos.
- **Movimiento.** El editor: nombre, categoría, nota, importe, cargo/abono, tipo de cambio y tipo.
- **Fuera:** crear categorías, aprendizaje de movimientos, borrar movimientos

## Supuestos

- **Periodo inicial = `2026-08`**, el que declara el archivo. El selector solo ofrece meses que existen en la data.
- **Lo no confirmado no suma** (`pendiente`, `en_disputa`, `programada`) pero sí se muestra. Un balance no debe moverse por dinero que aún no salió.
- **Renombrar no reagrupa.** El consenso por comercio sigue leyendo la descripción del banco; si no, un alias movería sin querer la categoría de otros cargos.
- **Un pago de tarjeta propia no es gasto**: sus consumos ya están uno por uno en el mismo archivo. Contarlo cobraría dos veces.
- **Sin tipo de cambio no se convierte.** El único movimiento en USD queda fuera de totales.

## Qué encontré en los datos y cómo lo manejé

Nada se corrige en el archivo: se interpreta al leer y el registro original queda intacto.

| Hallazgo | Casos | Trato |
|---|---|---|
| Monto en texto | `txn_024`, `txn_048` | Se parsea; entraban como `NaN` |
| Signo invertido | los mismos 2 | Positivo en Supermercado/Seguros → cargo |
| Categoría `null` o `""` | `txn_016`, `txn_030`, `txn_049`, `txn_061` | Consenso del comercio o "Sin categoría" |
| Categoría inconsistente | `txn_005`, `txn_009` | Consenso del comercio |
| Duplicados | `txn_021/022`, `txn_044/045` | Gana `confirmada` |
| Fuera de periodo | `txn_059`, `txn_060` | Fuera del **alcance** del mes, no excluidos |
| No confirmados | `txn_053`, `txn_056`, `txn_061` | Visibles, fuera de totales |
| USD sin tipo de cambio | `txn_032` | Fuera de totales |
| Traspaso interno | `txn_010` | No es gasto |
| Reembolso | `txn_028` ↔ `txn_007` | Neteado dentro de `Compras` |
| Monto en cero | `txn_036` | Se deja; no sé si es comisión o dato perdido |


- **No adivino sin evidencia.** `txn_049` ("TIENDA DE CONVENIENCIA") no identifica un comercio real, así que queda en "Sin categoría".
- **Consenso ≠ catálogo.** DIDI y OXXO se resuelven con los otros cargos del mismo comercio, que es evidencia del archivo. Los comercios que aparecen una sola vez no se pueden deducir: ahí la categoría la puse yo, y la app distingue los dos casos.

**Importes en enteros de centavos, no float.** No es teórico: en float el balance sale `-62580.149999999994`.

## Cómo usé IA

- **Claude Code** en sesión continua; **Stitch** para las pantallas.
- **Declaré las reglas antes que el código.** La mitad mecánica vive en `eslint.config.js` y falla el build: `any`, `as X`, `!` y `@ts-expect-error` sin descripción son error. La de criterio, en `CLAUDE.md`.
- **Mantuve el contexto limpio con `/compact`.** Una sesión larga arrastra decisiones ya revertidas y el modelo las revive.
- **Me generó** el setup (Tailwind + design system), la capa de dominio y las pantallas a partir de los mocks.
- **Tiré los datos de los mocks**, porque Stitch inventa cifras: una lista "recientes" ordenada por monto, un detalle que mezclaba tres registros (`txn_027`, `txn_005`, `txn_023`). Verifiqué cada una contra el JSON antes de construir.
- **Lo corregí donde se equivocó de criterio.** Quitó el botón "sí, es repetido" porque no movía ningún número: cierto, pero sí movía el estado, y sin él "necesitan tu decisión" solo aceptaba una de las dos respuestas.
- **Y me encontró cosas que yo no vi:** el detalle mostraba la hora en el huso del navegador y no en el del banco.

## Qué haría con una semana más

- "Aplicar a los próximos cargos de este comercio": convertir una corrección en regla, para dejar de equivocarse dos veces igual.
- Persistir las correcciones y aprender de ellas.
- Tipo de cambio automático por fecha, en vez de pedírselo al usuario.
- Reembolsos parciales: hoy solo ligo montos idénticos.

## Tiempo invertido

- _(pendiente)_
