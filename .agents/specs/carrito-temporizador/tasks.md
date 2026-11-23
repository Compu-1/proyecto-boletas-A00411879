# Tareas: Carrito y temporizador de retención

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/carrito-temporizador` · **Fecha**: 2026-11-23

Comandos de `codigo_base/` con `JAVA_HOME` e `ICE_HOME` exportados (`conventions/stack.md`); comandos de `client-js/` desde esa carpeta. Sin pruebas automáticas en el frontend (D-007): cada tarea dice qué observar. Las verificaciones de dos ventanas siguen la tabla "Pruebas" del plan.

## Resumen

- [ ] T1: Rama y documentos del spec
- [ ] T2: Pruebas JUnit de quitar una silla (paralela con T3)
- [ ] T3: Capa `api` y `store` (paralela con T2)
- [ ] T4: Funciones puras `seats.js` y migración del plano y los contadores
- [ ] T5: Carrito `Cart` con su página y estilos
- [ ] T6: Conexión en `app.js` y verificación en dos ventanas
- [ ] T7: Cierre

## T1: Rama y documentos del spec
- **Rama**: `git flow feature start carrito-temporizador` (desde `develop`)
- **Archivos**: `.agents/specs/carrito-temporizador/` (spec, plan, tasks), `.agents/memory/decisions.md`, `.agents/memory/epics.md`, `.agents/designs/ui.md`
- **Acciones**:
  - [ ] Commit con spec y plan aprobados, tareas, decisiones D-030 a D-035 y HU-08 a HU-10 en `epics.md`.
  - [ ] En `ui.md`, quitar la mecha: gesto 1, la línea de la composición, la fila `FuseBar` de componentes y la mención en "Movimiento".
- **Verificación**: [ ] `git status --short` vacío · [ ] `grep -in 'mecha\|fusebar' .agents/designs/ui.md` vacío
- **Commit**: `docs(agents): aprueba spec y plan de carrito-temporizador`

## T2: Pruebas JUnit de quitar una silla (paralela con T3)
- **Archivos**: `codigo_base/server/src/test/java/co/icesi/booking/server/BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [ ] Agregar `hu10_quitarPropia_otroLaRetiene`: tras `releaseSeat` del dueño, la silla se ve disponible y otro comprador la retiene (HU-10: quitar una silla y los demás la ven liberada).
  - [ ] Agregar `hu10_quitarVencidaYaTomada_noLibera`: con el reloj controlable de la prueba, la retención vence, otro comprador la toma y `releaseSeat` del primero devuelve `false` sin quitársela al nuevo dueño (HU-10: quitar sin conexión / ya vencida).
- **Verificación**: [ ] `./gradlew build` · [ ] `./gradlew :server:test --tests 'co.icesi.booking.server.BookingServiceImplTest'`
- **Commit**: `test(server): cubre quitar una silla propia o vencida`

## T3: Capa `api` y `store` (paralela con T2)
- **Archivos**: `client-js/src/js/api.js`, `client-js/src/js/store.js` (modificar)
- **Acciones**:
  - [ ] En `api.js`, hacer que `getSeats()` agregue `expiresAt` a cada silla (`lockTimestamp + lockDurationSeconds * 1000`, con `Ice.Long` pasado a número; `0` si no está retenida) (D-031).
  - [ ] En `api.js`, agregar `releaseSeat(seatId, clientId)` que devuelve vacío o lanza `Error`; pasa por `translate`.
  - [ ] En `store.js`, agregar `now` (inicia en `Date.now()`) y `releasedSeats: new Set()`.
- **Verificación**: [ ] `npm run build` · [ ] manual: retener una silla y ver en la consola que `getState().seats` trae `expiresAt` unos 90 s adelante de `Date.now()`
- **Commit**: `feat(client-js): agrega expiración y liberación de sillas en api y store`

## T4: Funciones puras `seats.js` y migración del plano y los contadores
- **Archivos**: `client-js/src/js/seats.js` (crear), `client-js/src/js/components/SeatMap.js`, `client-js/src/js/components/EventHeader.js` (modificar)
- **Acciones**:
  - [ ] Crear `seats.js` con `visibleState(seat, { clientId, now, releasedSeats })` (movida desde `SeatMap`; una silla mía vencida o quitada se ve disponible, D-033 y D-034), `remainingSeconds(seat, now)`, `myCart(state)` (mías vigentes, ordenadas por tiempo de retención) y `formatTime(segundos)` en `mm:ss`.
  - [ ] Hacer que `SeatMap` use `visibleState` de `seats.js` con `now` y `releasedSeats` del estado.
  - [ ] Hacer que `EventHeader` cuente Disponibles, Retenidas y Vendidas con `visibleState`, para que sigan sumando 90.
- **Verificación**: [ ] `npm run build` · [ ] manual: el plano y los contadores se ven igual que antes con el servidor encendido
- **Commit**: `refactor(client-js): centraliza el estado visible de las sillas`

## T5: Carrito `Cart` con su página y estilos
- **Archivos**: `client-js/src/js/components/Cart.js` (crear), `client-js/src/index.html`, `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [ ] Crear `Cart(contenedor, { onRemove })` con `render(estado)`: talón "Tu boleta" con líneas `silla · zona · precio · mm:ss · ×` desde `myCart`, corte perforado y total; vacío muestra "Tu carrito está vacío" sin total; el `×` llama a `onRemove(id)`; sin botón Pagar (D-035); textos con `textContent`.
  - [ ] Agregar `<aside id="cart">` junto a `#seat-area` en `index.html`.
  - [ ] Agregar `.cart__*` en `main.css` con solo variables de `:root`: dos columnas desde 900 px (talón de 320 px) y el talón debajo del plano en pantallas menores.
- **Verificación**: [ ] `npm run build` · [ ] `grep -nE '#[0-9A-Fa-f]{3,6}' client-js/src/css/main.css` solo coincide dentro de `:root` · [ ] manual: sembrando `setState({ seats })` con 2 sillas mías se ven sus líneas y el total
- **Commit**: `feat(client-js): agrega el carrito de sillas retenidas`

## T6: Conexión en `app.js` y verificación en dos ventanas
- **Archivos**: `client-js/src/js/app.js` (modificar)
- **Acciones**:
  - [ ] Crear `Cart` y repintarlo en `render`; agregar el reloj de 250 ms que hace `setState({ now: Date.now() })` (D-032).
  - [ ] Agregar `handleRemove(id)`: añade el id a `releasedSeats`, llama a `releaseSeat`, error de conexión pone `connection: 'offline'` y otro error va al `Toast`; después refresca las sillas.
  - [ ] En `handleSeatClick`, sacar el id de `releasedSeats`; en `refreshSeats`, limpiar de `releasedSeats` las sillas que la foto ya no muestra mías.
- **Verificación**: [ ] `npm run build` · [ ] manual con servidor + `npm start` y dos ventanas, según la tabla del plan: carrito vacío con "Tu carrito está vacío"; retener A-1 da `01:30` y $120.000; con F-3 a los 40 s se ven `00:50` y `01:30`, $165.000; recargar conserva el tiempo; al llegar a 0 sale sin aviso y la otra ventana puede tomarla; quitar libera en la otra ventana en máximo 2 s; con el servidor detenido la cuenta sigue y quitar la saca del carrito
- **Commit**: `feat(client-js): muestra el carrito con cuenta regresiva y permite quitar sillas`

## T7: Cierre
- [ ] `./gradlew build`, `./gradlew test` y `npm run build` en verde
- [ ] Actualizar `project_state.md` (spec cerrada; sigue `checkout-reservas`), marcar HU-08 a HU-10 en `epics.md` y revisar `decisions.md`
- **Commit**: `docs(agents): cierra carrito-temporizador`
- [ ] `git flow feature finish carrito-temporizador` (solo si el usuario lo pide)
