# Decisiones

## Qué muestro y qué dejo fuera

**Resumen.** Arriba, el gasto del mes y una frase que lo explica: *"Más de la
mitad se te fue en Vivienda"*. Es el requisito de los 10 segundos — con 14
categorías, la renta (58%) queda escondida como una rebanada más si solo
pongo una gráfica. Debajo, entró y balance; luego el desglose y la lista.

**Movimientos.** Lista completa del mes agrupada por día, con el total de
cada día sumando **solo lo que cuenta**. Los excluidos se ven tachados con su
motivo, no se esconden. Filtros por categoría y cuenta, y búsqueda por
concepto. Las opciones del panel salen de los datos en alcance, no de una
lista fija: así ninguna categoría se pierde y los conteos nunca mienten.

**Detalle.** Cambiar categoría, el registro original sin tocar, y —si una
regla lo excluyó— el motivo con la opción de incluirlo de todos modos.

- Las reglas se divulgan en **un solo lugar**: la tira "N movimientos
  excluidos del cálculo", con sus motivos. Seis flujos separados no cabían.
- **Selector de mes** con solo los meses que la data tiene: ago 2026 (59),
  sep 2026 (1) y nov 2025 (1).
- **Fuera:** tipo de cambio, control Cargo/Abono, confirmar duplicados,
  preview "tu gasto sube de X a Y", el toggle "Por categoría" y la nav
  inferior con Metas/Perfil. Las reglas que los motivan sí están
  implementadas; lo que no construí son sus pantallas.
- Sin persistencia: las correcciones viven en memoria y se pierden al recargar.

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
| Fuera de periodo | `txn_059`, `txn_060` | Fuera del **alcance** del mes, no excluidos |
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

**"Fuera de periodo" es alcance, no exclusión.** Al agregar el selector de
mes, decir que un cargo de agosto está "excluido del cálculo de septiembre"
deja de tener sentido: no es de septiembre. Ahora cada mes solo revisa sus
propios movimientos. Agosto pasa de 9 exclusiones a 7 y **los totales no
cambian** —esos dos nunca sumaron—, y ahora `txn_059` y `txn_060` sí se
pueden ver, cada uno en su mes.

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
- Verificó el diseño de Stitch contra los datos y encontró tres inconsistencias
  que Stitch inventó: la lista "recientes" venía ordenada por monto, el
  subtítulo de excluidos decía "retiros" (que sí se incluyen), y la barra
  segmentada no cuadraba con su propia lista.

## Qué haría con una semana más

- Las pantallas de ajuste que dejé fuera, empezando por anular exclusiones.
- Tipo de cambio real para el movimiento en USD.
- Persistir las correcciones de categoría y aprender de ellas.
- Reembolsos parciales: hoy solo ligo montos idénticos.

## Tiempo invertido

- _(pendiente)_
