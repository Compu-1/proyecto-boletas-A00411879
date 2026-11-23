# Tareas: Plano de sillas en vivo y retención

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/mapa-sillas` · **Fecha**: 2026-11-23

Comandos de `codigo_base/` con `JAVA_HOME` e `ICE_HOME` exportados (`conventions/stack.md`); comandos de `client-js/` desde esa carpeta. Sin pruebas automáticas en el frontend (D-007): cada tarea dice qué observar. Las verificaciones manuales de dos ventanas siguen la tabla "Pruebas" del plan.

## Resumen

- [x] T1: Rama y documentos del spec
- [x] T2: Mensaje de rechazo en el servidor y sus pruebas
- [x] T3: Capa `api` y `store` (paralela con T2)
- [x] T4: Plano de sillas `SeatMap` con sus estilos (paralela con T5)
- [x] T5: Contadores del encabezado y `Toast` (paralela con T4)
- [ ] T6: Conexión de todo en `app.js` y verificación en dos ventanas
- [ ] T7: Cierre

## T1: Rama y documentos del spec
- **Rama**: `git flow feature start mapa-sillas` (desde `develop`)
- **Archivos**: `.agents/specs/mapa-sillas/` (spec, plan, tasks), `.agents/memory/decisions.md`, `.agents/memory/epics.md`, `.agents/designs/ui.md`
- **Acciones**:
  - [x] Commit con spec y plan aprobados, tareas, decisiones D-022 a D-027, HU-06 y HU-07 en `epics.md` y la corrección de `ui.md` (clic en silla propia no hace nada; contador "Disponibles").
- **Verificación**: [ ] `git status --short` vacío
- **Commit**: `docs(agents): aprueba spec y plan de mapa-sillas`

## T2: Mensaje de rechazo en el servidor y sus pruebas
- **Archivos**: `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServiceImpl.java` (modificar), `codigo_base/server/src/test/java/co/icesi/booking/server/BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [x] En `lockSeat`, cambiar el texto de `SeatNotAvailableException` a `"La silla <id> ya no está disponible"` (D-026), sin tocar el `Thread.sleep(25)` ni el `synchronized`.
  - [x] Actualizar `hu01_mismaSillaMismoInstante_ganaUno` para que espere el texto nuevo.
  - [x] Agregar `hu07_sillaVendida_mensaje`: una silla vendida rechaza `lockSeat` con "La silla B-3 ya no está disponible" (HU-07: silla que ya tomó otro).
- **Verificación**: [ ] `./gradlew build` · [ ] `./gradlew :server:test --tests 'co.icesi.booking.server.BookingServiceImplTest'` · [ ] con el servidor encendido, `./gradlew :client:runClient --args="--test-concurrency"` muestra `Peticiones que creyeron ganar el bloqueo : 1`
- **Commit**: `fix(server): unifica el mensaje de silla no disponible`

## T3: Capa `api` y `store` (paralela con T2)
- **Archivos**: `client-js/src/js/api.js`, `client-js/src/js/store.js` (modificar)
- **Acciones**:
  - [x] En `api.js`, agregar `getSeats()` que llama a `getAllSeats()` y devuelve `[{ id, zone, row, number, price, state, lockedBy }]` con `zone` y `state` en texto (`'vip'`, `'locked'`...), y `lockSeat(seatId, clientId)` que devuelve vacío o lanza `Error` con el `reason`; ambas pasan por `translate`.
  - [x] En `store.js`, agregar `seats: []`, `pendingSeats: new Set()` y `clientId`, tomado de `sessionStorage` o generado una vez con formato `WEB-XXXXXX` (D-025).
- **Verificación**: [ ] `npm run build` · [ ] manual: `getState().clientId` en la consola conserva el valor al recargar la pestaña
- **Commit**: `feat(client-js): agrega consulta y retención de sillas en api y store`

## T4: Plano de sillas `SeatMap` con sus estilos (paralela con T5)
- **Archivos**: `client-js/src/js/components/SeatMap.js` (crear), `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [x] Crear `SeatMap(contenedor, { onSeatClick })` con `render({ seats, clientId, pendingSeats, connection })`: escenario, zonas VIP, Platea y General con nombre y precio, filas A-I de 10 sillas con pasillo entre la 5 y la 6, y leyenda de los 4 estados.
  - [x] Cada silla es un `<button>`; solo las disponibles, sin retención pendiente y con conexión llaman a `onSeatClick(id)` (D-027). Textos con `textContent`.
  - [x] Estilos `.seat-map__*` con modificadores `--available`, `--mine`, `--other` (borde punteado), `--booked` y `--offline` (opacidad 40 %), solo con variables de `:root`.
- **Verificación**: [ ] `npm run build` · [ ] `grep -nE '#[0-9A-Fa-f]{3,6}' client-js/src/css/main.css` solo coincide dentro de `:root` · [ ] manual: sembrando `setState({ seats })` desde la consola se ven los 4 estados distintos
- **Commit**: `feat(client-js): agrega el plano de sillas`

## T5: Contadores del encabezado y `Toast` (paralela con T4)
- **Archivos**: `client-js/src/js/components/EventHeader.js` (modificar), `client-js/src/js/components/Toast.js` (crear), `client-js/src/index.html`, `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [x] En `EventHeader`, pintar Disponibles, Retenidas y Vendidas contadas desde `seats` (D-024); con `seats` vacío no pinta contadores.
  - [x] Crear `Toast(contenedor)` con `show(mensaje)`: se oculta a los 4 s y un mensaje nuevo reemplaza al anterior.
  - [x] Agregar `<div id="toast">` a `index.html` y los estilos `.event-header__counter*` y `.toast*`.
- **Verificación**: [ ] `npm run build` · [ ] manual: con 3 sillas retenidas y 1 vendida en `setState`, los contadores muestran 86, 3 y 1 y suman 90; `Toast.show` desde la consola desaparece a los 4 s
- **Commit**: `feat(client-js): agrega contadores de aforo y avisos`

## T6: Conexión de todo en `app.js` y verificación en dos ventanas
- **Archivos**: `client-js/src/js/app.js` (modificar)
- **Acciones**:
  - [ ] Crear `SeatMap` y `Toast`, y repintarlos en `render`.
  - [ ] Agregar `refreshSeats()` con descarte de respuestas viejas (D-023) y el ciclo de 1 s que agenda la siguiente consulta al terminar la anterior y se detiene al quedar sin conexión (D-022).
  - [ ] Agregar `handleSeatClick(id)`: marca la silla en `pendingSeats`, llama a `lockSeat`, refresca el plano; error de negocio al `Toast`; error de conexión pone `connection: 'offline'`; siempre quita la marca pendiente.
- **Verificación**: [ ] `npm run build` · [ ] manual con servidor + `npm start` y dos ventanas, según la tabla del plan: 90 sillas y contadores 90/0/0; retener A-1 se ve punteada en la otra en máximo 2 s; clic en A-1 propia no genera otro `[LOCK-OK]`; C-5 vuelve a blanca máximo 2 s tras los 90 s; con el servidor detenido el aviso sale en máximo 10 s, el plano queda al 40 % y el clic no retiene
- **Commit**: `feat(client-js): muestra el plano en vivo y retiene sillas`

## T7: Cierre
- [ ] `./gradlew build`, `./gradlew test` y `npm run build` en verde
- [ ] Actualizar `project_state.md` (spec cerrada, nota de que `carrito-temporizador` sigue), marcar HU-06 y HU-07 en `epics.md` y revisar `decisions.md`
- **Commit**: `docs(agents): cierra mapa-sillas`
- [ ] `git flow feature finish mapa-sillas` (solo si el usuario lo pide)
