# Plan: Pago, comprobante y mis compras

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/checkout-reservas` · **Fecha**: 2026-11-23 · **Estado**: Aprobado

## Resumen

El contrato no cambia: ya existen `confirmBooking` y `getMyBookings`. En el servidor, `confirmBooking` cambia los textos de validación por los del spec, exige un correo `texto@dominio.ext` y rechaza los pedidos con una silla repetida (defecto 1). En el navegador, el talón gana el botón Pagar, que abre un diálogo con la lista de sillas congelada al abrirlo. El nombre y el correo los valida solo el servidor. Si el pago sale bien, el diálogo da paso al comprobante y se recargan "Mis compras", una sección fija bajo el talón.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice | `BookingService.ice` | sin cambios | `confirmBooking`, `getMyBookings`, `BookingRecord`, `BookingResult` ya existen |
| server | `BookingServiceImpl.java` | modificar | `confirmBooking`: orden de validación sin sillas -> nombre -> correo -> repetidas -> cada silla (la de cada silla no cambia); textos "Elige al menos una silla para pagar", "Escribe tu nombre", "Escribe un correo válido", "La silla <id> está repetida en el pedido" (`InvalidBookingException`); correo con `trim()` y patrón constante `EMAIL_PATTERN` = `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| test | `BookingServiceImplTest.java` | modificar | pruebas `hu11_*`, `hu12_*`, `hu13_*` (ver Pruebas) |
| api | `client-js/src/js/api.js` | modificar | `export async function confirmBooking(seatIds, clientId, name, email)` -> `{ code, total, timestamp }`; `export async function getMyBookings(clientId)` -> `[{ code, seatIds, total, name, email, timestamp }]` (`Ice.Long` -> `toNumber()`) |
| store | `client-js/src/js/store.js` | modificar | `checkout`: `null` o `{ items, sending, error }`; `receipt`: `null` o `{ code, items, total, name, email }`; `bookings`: `[]` |
| components | `components/Cart.js` | modificar | `Cart(contenedor, { onRemove, onPay })`: botón "Pagar" bajo el total, solo con sillas en el carrito |
| components | `components/CheckoutModal.js` | crear | `CheckoutModal(contenedor, { onConfirm, onCancel })` -> `{ render(estado) }`: `<dialog>` blanco con resumen (sillas, total), nombre, correo, error en rojo y Confirmar; `onConfirm({ name, email })`; Confirmar deshabilitado con `sending`; Esc o Cancelar -> `onCancel()`; vacía el formulario cada vez que abre |
| components | `components/Receipt.js` | crear | `Receipt(contenedor, { onClose })` -> `{ render(estado) }`: `<dialog>` blanco con el código enorme, sillas con zona y precio, total, nombre, correo y "Guarda este código" |
| components | `components/MyBookings.js` | crear | `MyBookings(contenedor)` -> `{ render(estado) }`: "Mis compras" con código, sillas, total, nombre y correo, de la más reciente a la más antigua; vacío: "Aún no tienes compras" |
| app | `client-js/src/js/app.js` | modificar | `handlePay()`, `handleConfirm({ name, email })`, `handleCancel()`, `handleCloseReceipt()`, `refreshBookings()` al arrancar y tras cada pago |
| html | `client-js/src/index.html` | modificar | `<aside class="sidebar">` con `#cart` y `#my-bookings`; `<dialog id="checkout">` y `<dialog id="receipt">` |
| css | `client-js/src/css/main.css` | modificar | `.sidebar`, `.checkout__*`, `.receipt__*`, `.my-bookings__*`, `.cart__pay`; paneles invertidos solo con tokens de `ui.md` |
| diseño | `.agents/designs/ui.md` | modificar | "Mis compras" pasa de `Receipt` a `MyBookings`, bajo el talón |

## Decisiones

### D1: Quién valida el nombre y el correo
- **Contexto**: RN-02 debe cumplirse tanto en el navegador como desde el cliente Java de pruebas.
- **Opciones**: A) solo el servidor, con los textos del spec; B) el navegador y también el servidor.
- **Elegida**: A. **Por qué**: hay una sola regla y un solo texto, y se prueba con JUnit, como D-026 con los rechazos de retención. B duplica la regla y los textos, que pueden terminar diferentes. Costo aceptado: sin conexión, el Comprador ve el aviso de conexión antes que el de datos inválidos.

### D2: Qué sillas se pagan
- **Contexto**: en el escenario "Una retención vence antes de pagar", A-1 vence mientras el Comprador llena el formulario. El spec pide que no se venda ninguna (RN-03, todo o nada).
- **Opciones**: A) pagar la lista congelada al abrir el diálogo (`checkout.items`); B) pagar el carrito del momento de confirmar.
- **Elegida**: A. **Por qué**: el Comprador confirma exactamente el resumen que ve. B pagaría solo F-3 sin avisar que A-1 se perdió. Tras un rechazo de negocio se consulta la foto y `checkout.items` se reemplaza por el carrito vigente: el siguiente intento paga F-3, y si ya no queda nada el servidor responde "Elige al menos una silla para pagar".

### D3: Diálogo nativo para pago y comprobante
- **Contexto**: `ui.md` pide paneles blancos encima de la taquilla.
- **Opciones**: A) `<dialog>` con `showModal()`; B) una capa `div` hecha a mano.
- **Elegida**: A. **Por qué**: el navegador ya bloquea el fondo, maneja el foco y cierra con Esc (evento `cancel`), sin código extra. No es `alert()`: no bloquea el reloj ni la consulta de sillas.

### D4: Un pago a la vez
- **Contexto**: un doble clic en Confirmar mandaría dos pagos. El segundo fallaría con "ya fue vendida" y ocultaría el comprobante.
- **Elegida**: `checkout.sending` deshabilita Confirmar desde el clic hasta la respuesta, igual que `pendingSeats` en la retención (D-027).

### D5: Dónde se ven "Mis compras" y cuándo se cargan
- **Contexto**: RF-6 pide consultarlas y RN-07 pide que sobrevivan a una recarga. `ui.md` las ponía dentro de `Receipt`, que solo se abre tras pagar.
- **Opciones**: A) una sección fija bajo el talón, cargada con `getMyBookings` al arrancar y tras cada pago; B) un botón que abre un diálogo; C) consultarlas cada 1 s junto con la foto.
- **Elegida**: A. **Por qué**: siempre se ve y no necesita botón ni diálogo extra. Solo cambian cuando este Comprador paga, así que C sumaría llamadas al candado (D-010) sin ningún beneficio. La recarga funciona sola, porque el `clientId` sobrevive (D-025).

### D6: Datos del comprobante
- **Contexto**: `BookingResult` trae código y total, pero no la zona ni el precio de cada silla, ni el nombre y el correo.
- **Elegida**: `receipt` se arma con `checkout.items` (zona y precio), el nombre y el correo enviados, y el código y el total de la respuesta. No se cambia el contrato.

## Pruebas

| Escenario del spec | Tipo | Archivo o qué observar |
| :--- | :--- | :--- |
| HU-11: pagar con datos válidos | JUnit + manual | `hu02_pagarVigentes` (existe); retener A-1 y F-3 y pagar como Ana Pérez: carrito vacío y comprobante |
| HU-11: datos de contacto inválidos | JUnit + manual | `hu11_datosInvalidos_mensaje` (nombre `""` y `"   "`; correo `""`, `"ana@"`, `"ana.correo.com"`, `"ana @correo.com"`): texto exacto, A-1 sigue retenida por Ana con el mismo `lockTimestamp`; en el navegador, error en rojo y datos conservados |
| HU-11: pagar con el carrito vacío | JUnit + manual | `hu11_sinSillas_mensaje`; abrir el pago con una silla a `00:05`, dejarla vencer y confirmar dos veces: "ha expirado" y luego "Elige al menos una silla para pagar" |
| HU-11: una retención vence antes de pagar | JUnit + manual | `hu02_sillaInvalida_noVendeNinguna`, caso `retenidaPorAnaVencida` (existe); manual con A-1 a `00:01` y F-3: mensaje, nada vendido y F-3 conserva su tiempo |
| HU-11: pagar sin conexión | manual | detener el servidor con el diálogo abierto y confirmar: mensaje de sin conexión, B-7 sigue en el talón |
| HU-12: ver el comprobante | manual | código `RES-` + 8 caracteres, A-1 y F-3 con zona y precio, $165.000, nombre y correo |
| HU-12: vendidas para todos | JUnit + manual | `hu02_dosCompradoresMismaSilla` (existe); la ventana 2 ve A-1 vendida en 2 s o menos y no puede elegirla |
| HU-12: cada pago tiene su propio código | JUnit | `hu12_codigosDistintos` |
| HU-12: pedido con una silla repetida | JUnit | `hu12_sillaRepetida_rechaza`: texto exacto, 0 compras y A-1 sigue retenida por Ana (el navegador nunca repite sillas) |
| HU-13: ver compras confirmadas | JUnit + manual | `hu13_misCompras_soloLasMias`: Ana con 2 compras y Beto con 1, cada uno ve solo las suyas con sus totales, nombre y correo; manual con 2 pagos |
| HU-13: sin compras todavía | JUnit + manual | `hu13_sinCompras_vacio`; pestaña nueva: "Aún no tienes compras" |
| HU-13: recargar con compras | manual | pagar A-1 y recargar: la compra sigue en "Mis compras" |

Además, `./gradlew :client:runClient --args="--test-concurrency"` debe seguir dando 1 ganador.

## Riesgos y pendientes

- Las compras viven en memoria del servidor: si se reinicia, "Mis compras" queda vacía (ya pasa hoy, ver `project_state.md`).
- Al cerrar la feature se borra el defecto 1 de `project_state.md`.
