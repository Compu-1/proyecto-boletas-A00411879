# Tareas: Pago, comprobante y mis compras

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/checkout-reservas` · **Fecha**: 2026-11-23

Comandos de `codigo_base/` con `JAVA_HOME` e `ICE_HOME` exportados (`conventions/stack.md`); comandos de `client-js/` desde esa carpeta. Sin pruebas automáticas en el frontend (D-007): cada tarea dice qué observar. Las verificaciones de dos ventanas siguen la tabla "Pruebas" del plan.

## Resumen

- [x] T1: Rama y documentos del spec
- [x] T2: Validación del pago en el servidor y pruebas JUnit (paralela con T3)
- [ ] T3: Capa `api` y `store` (paralela con T2)
- [ ] T4: Botón Pagar y diálogo `CheckoutModal`
- [ ] T5: Comprobante `Receipt` y sección `MyBookings` (paralela con T4)
- [ ] T6: Conexión en `app.js` y verificación en dos ventanas
- [ ] T7: Cierre

## T1: Rama y documentos del spec
- **Rama**: `git flow feature start checkout-reservas` (desde `develop`; lleva los cambios sin commit de spec, plan, tareas, `epics.md` y `decisions.md`)
- **Archivos**: `.agents/specs/checkout-reservas/` (spec, plan, tasks), `.agents/memory/decisions.md`, `.agents/memory/epics.md`, `.agents/designs/ui.md`
- **Acciones**:
  - [x] En `ui.md`, sacar "Mis compras" de la fila `Receipt`, agregar la fila `MyBookings` (sección bajo el talón) y anotar que pago y comprobante son `<dialog>` (D-039, D-041).
  - [x] Commit con spec y plan aprobados, tareas, decisiones D-037 a D-042 y HU-11 a HU-13 en `epics.md`.
- **Verificación**: [x] `git status --short` vacío · [x] `grep -n 'MyBookings' .agents/designs/ui.md` con una coincidencia
- **Commit**: `docs(agents): aprueba spec y plan de checkout-reservas`

## T2: Validación del pago en el servidor y pruebas JUnit (paralela con T3)
- **Archivos**: `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServiceImpl.java`, `codigo_base/server/src/test/java/co/icesi/booking/server/BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [x] Escribir primero las pruebas y verlas fallar: `hu11_datosInvalidos_mensaje` (nombre vacío o solo espacios; correo vacío, `ana@`, `ana.correo.com`, `ana @correo.com`; texto exacto y A-1 sigue retenida por Ana con el mismo `lockTimestamp`), `hu11_sinSillas_mensaje`, `hu12_sillaRepetida_rechaza` (texto exacto, 0 compras, A-1 sigue retenida), `hu12_codigosDistintos`, `hu13_misCompras_soloLasMias` (2 compras de Ana con totales, nombre y correo; 1 de Beto) y `hu13_sinCompras_vacio`.
  - [x] En `confirmBooking`, cambiar los textos por "Elige al menos una silla para pagar", "Escribe tu nombre" y "Escribe un correo válido", validar el correo con `trim()` y la constante `EMAIL_PATTERN` (D-037).
  - [x] En `confirmBooking`, rechazar con `InvalidBookingException("La silla <id> está repetida en el pedido")` antes de revisar cada silla (defecto 1, RN-04); orden: sin sillas, nombre, correo, repetidas, cada silla.
- **Verificación**: [x] `./gradlew build` · [x] `./gradlew :server:test --tests 'co.icesi.booking.server.BookingServiceImplTest'` (las nuevas y las 15 previas) · [x] `--test-concurrency` con 1 ganador
- **Commit**: `fix(server): valida datos y sillas repetidas al confirmar la compra`

## T3: Capa `api` y `store` (paralela con T2)
- **Archivos**: `client-js/src/js/api.js`, `client-js/src/js/store.js` (modificar)
- **Acciones**:
  - [ ] En `api.js`, agregar `confirmBooking(seatIds, clientId, name, email)`, que devuelve `{ code, total, timestamp }`, y `getMyBookings(clientId)`, que devuelve `[{ code, seatIds, total, name, email, timestamp }]` con `Ice.Long` pasado a número. Ambas pasan por `translate`.
  - [ ] En `store.js`, agregar `checkout: null`, `receipt: null` y `bookings: []`, con un comentario de su forma.
- **Verificación**: [ ] `npm run build` · [ ] manual: desde la consola, tras retener A-1, `confirmBooking` devuelve un código `RES-` y `getMyBookings` lo lista
- **Commit**: `feat(client-js): agrega pago y consulta de compras en api y store`

## T4: Botón Pagar y diálogo `CheckoutModal`
- **Archivos**: `client-js/src/js/components/Cart.js` (modificar), `client-js/src/js/components/CheckoutModal.js` (crear), `client-js/src/index.html`, `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [ ] En `Cart`, agregar `onPay` y el botón "Pagar" bajo el total, oculto con el carrito vacío.
  - [ ] Crear `CheckoutModal(contenedor, { onConfirm, onCancel })` con `render(estado)`: abre el `<dialog>` con `showModal()` cuando `checkout` pasa a tener valor y lo cierra cuando vuelve a `null`; muestra resumen de `checkout.items` y total, nombre, correo y `checkout.error` en rojo; Confirmar llama a `onConfirm({ name, email })` y queda deshabilitado con `sending` (D-040); Esc o Cancelar llaman a `onCancel()`; vacía el formulario al abrir; textos con `textContent`.
  - [ ] Agregar `<dialog id="checkout">` en `index.html` y `.cart__pay` y `.checkout__*` en `main.css` (panel blanco, solo variables de `:root`).
- **Verificación**: [ ] `npm run build` · [ ] manual: sembrando `setState({ checkout })` se abre el panel blanco con el resumen; Esc lo cierra
- **Commit**: `feat(client-js): agrega el botón pagar y el formulario de pago`

## T5: Comprobante `Receipt` y sección `MyBookings` (paralela con T4)
- **Archivos**: `client-js/src/js/components/Receipt.js`, `client-js/src/js/components/MyBookings.js` (crear), `client-js/src/index.html`, `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [ ] Crear `Receipt(contenedor, { onClose })` con `render(estado)`: `<dialog>` con el código enorme, sillas con zona y precio, total, nombre, correo y "Guarda este código"; Cerrar o Esc llaman a `onClose()` (D-042).
  - [ ] Crear `MyBookings(contenedor)` con `render(estado)`: título "Mis compras", una entrada por compra (código, sillas, total, nombre y correo), de la más reciente a la más antigua; vacío: "Aún no tienes compras" (D-041).
  - [ ] En `index.html`, envolver `#cart` y `#my-bookings` en `<aside class="sidebar">` y agregar `<dialog id="receipt">`; agregar `.sidebar`, `.receipt__*` y `.my-bookings__*` en `main.css` sin romper las dos columnas desde 900 px.
- **Verificación**: [ ] `npm run build` · [ ] `grep -nE '#[0-9A-Fa-f]{3,6}' client-js/src/css/main.css` solo dentro de `:root` · [ ] manual: sembrando `receipt` y `bookings` se ven el comprobante y la lista; sin compras se ve "Aún no tienes compras"
- **Commit**: `feat(client-js): agrega el comprobante y mis compras`

## T6: Conexión en `app.js` y verificación en dos ventanas
- **Archivos**: `client-js/src/js/app.js` (modificar)
- **Acciones**:
  - [ ] Crear `CheckoutModal`, `Receipt` y `MyBookings`, repintarlos en `render` y pasar `onPay` a `Cart`.
  - [ ] Agregar `handlePay()` (congela `myCart(state)` en `checkout.items`, D-038), `handleCancel()` y `handleCloseReceipt()`.
  - [ ] Agregar `handleConfirm({ name, email })`. Al pagar bien, arma `receipt`, cierra `checkout`, refresca sillas y compras. Un rechazo de negocio pone el texto en `checkout.error`, refresca sillas y reemplaza `checkout.items` por el carrito vigente. Un error de conexión pone `connection: 'offline'` y el texto de sin conexión en `checkout.error`.
  - [ ] Agregar `refreshBookings()`, que se llama al arrancar (tras `getEventInfo`) y tras cada pago.
- **Verificación**: [ ] `npm run build` · [ ] manual con servidor + `npm start` y dos ventanas, según la tabla del plan: pagar A-1 y F-3 como Ana Pérez da comprobante `RES-` + 8, $165.000, y la otra ventana ve las dos vendidas en máximo 2 s; nombre vacío y `ana.correo.com` muestran su error y conservan los datos; A-1 a `00:01` da "ha expirado", nada vendido y F-3 sigue; confirmar sin sillas da "Elige al menos una silla para pagar"; doble clic en Confirmar da una sola compra; servidor detenido da sin conexión y B-7 sigue; recargar conserva "Mis compras"
- **Commit**: `feat(client-js): conecta el pago, el comprobante y mis compras`

## T7: Cierre
- [ ] `./gradlew build`, `./gradlew test` y `npm run build` en verde
- [ ] Actualizar `project_state.md` (spec cerrada; quitar el defecto 1 y su mención en "Siguiente"; sigue `despliegue-vm` opcional), marcar HU-11 a HU-13 en `epics.md` y revisar `decisions.md`
- **Commit**: `docs(agents): cierra checkout-reservas`
- [ ] `git flow feature finish checkout-reservas` (solo si el usuario lo pide)
