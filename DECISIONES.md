# Decisiones

## Qué muestro y qué dejo fuera

- _(pendiente — se llena al construir la pantalla)_
- Fuera: input de tipo de cambio, control Cargo/Abono, flujo de confirmar
  duplicados, preview "tu gasto sube de X a Y". Las reglas que los motivan sí
  están implementadas; lo que no construí son sus pantallas.
- Las 9 reglas se divulgan en un solo lugar —"N movimientos fuera del
  cálculo", con el motivo de cada uno— en vez de seis flujos.

## Supuestos

- **Periodo = `2026-08`**, el que declara el archivo. No hay selector de mes.
- **Lo no confirmado no suma** (`pendiente`, `en_disputa`, `programada`) pero
  sí se ve. Un balance no debe moverse por dinero que aún no salió.
- **Un retiro de cajero es gasto.** Traslada dinero, no lo consume, pero el
  usuario perdió visibilidad de él. `Efectivo` queda como categoría ciega.
- **Un pago de tarjeta propia no es gasto**: sus consumos ya están uno por uno
  en el mismo archivo. Contarlo cobraría dos veces.
- **Sin tipo de cambio no se convierte.** El único movimiento en USD queda
  fuera de totales en vez de inventarle un TC.
- Un `estado` o `moneda` desconocido no descarta el movimiento: se trata como
  no confirmado y sigue visible.

## Qué encontré en los datos y cómo lo manejé

61 movimientos, 9 problemas reales. Nada se corrige en el archivo: se
interpreta al leer y el registro original queda intacto.

| Hallazgo | Casos | Trato |
|---|---|---|
| Monto en texto | `txn_024`, `txn_048` | Se parsea; entraban como `NaN` |
| Signo invertido | los mismos 2 | Positivo en Supermercado/Seguros → cargo |
| Categoría `null` o `""` | `txn_016`, `txn_030`, `txn_049`, `txn_061` | Consenso del comercio o "Sin categoría" |
| Categoría inconsistente | `txn_005`, `txn_009` | Consenso del comercio |
| Duplicados | `txn_021/022`, `txn_044/045` | Gana `confirmada` |
| Fuera de periodo | `txn_059`, `txn_060` | Visibles, fuera de totales |
| No confirmados | `txn_053`, `txn_056`, `txn_061` | Visibles, fuera de totales |
| USD sin tipo de cambio | `txn_032` | Fuera de totales |
| Traspaso interno | `txn_010` | No es gasto |
| Reembolso | `txn_028` ↔ `txn_007` | Neteado dentro de `Compras` |
| Monto en cero | `txn_036` | Se deja; no sé si es comisión exonerada o dato perdido |

Leer el archivo tal cual da **−$73,993.75**; con reglas da **−$62,580.15**.
Una diferencia de **$11,413.60, el 15%**.

Dos decisiones que quiero explicar:

- **No adivino cuando no hay evidencia.** `txn_049` ("TIENDA DE CONVENIENCIA")
  no identifica un comercio real, así que queda en "Sin categoría".
- **Consenso ≠ catálogo.** DIDI y OXXO se resuelven con los otros cargos del
  mismo comercio, que es evidencia del archivo. Spotify y Farmacias aparecen
  una sola vez: ahí la categoría la puse yo. 42 de 49 comercios aparecen una
  vez, así que el consenso no generaliza y la app distingue ambos casos.

**Importes en enteros de centavos, no float.** No es teórico: en float el
balance sale `-62580.149999999994`.

El pipeline corre y da 52 incluidos, 9 excluidos, gasto $84,230.15, ingreso
$21,650.00, `Compras` neteada en $5,983.00.

## Cómo usé IA

- Claude Code para todo el proyecto, en sesión continua.
- Análisis del dataset: yo hice el pase inicial; Claude lo verificó contra el
  JSON fila por fila y encontró que mi ejemplo de error de punto flotante
  estaba mal, y que R03 mezclaba dos niveles de evidencia distintos.
- Generó el setup (Tailwind + design system) y la capa de dominio.
- Le corregí el alcance: propuso tests y un script de arquitectura en CI; los
  quité por el time-box.

## Qué haría con una semana más

- Las pantallas de ajuste que dejé fuera, empezando por anular exclusiones.
- Tipo de cambio real para el movimiento en USD.
- Persistir las correcciones de categoría y aprender de ellas.
- Reembolsos parciales: hoy solo ligo montos idénticos.

## Tiempo invertido

- _(pendiente)_
