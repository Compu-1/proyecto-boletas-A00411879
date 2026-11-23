# Tareas: Sillas exclusivas y sin sobreventa con compradores simultáneos

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/concurrencia-backend` · **Fecha**: 2026-11-22

Comandos desde `codigo_base/`, con `JAVA_HOME` e `ICE_HOME` exportados (`conventions/stack.md`). Archivo de pruebas: `server/src/test/java/co/icesi/booking/server/BookingServiceImplTest.java`. Cada prueba se escribe primero y se ve en rojo antes de la corrección.

## Resumen

- [x] T1: Documentos del spec en la rama
- [x] T2: Reloj inyectable y vencimiento exacto a los 90 s
- [x] T3: Exclusión mutua en las operaciones del servicio
- [x] T4: Consultas con estado efectivo y copias
- [x] T5: Pago todo o nada
- [x] T6: Cierre

## T1: Documentos del spec en la rama
- **Rama**: ya creada con `git flow feature start concurrencia-backend`
- **Archivos**: `README.md`, `docs/`, `.gitignore`, `.agents/` (spec, plan, decisiones, estado)
- **Acciones**:
  - [x] Commit previo con la reorganización de carpetas, el README único y el `.gitignore`.
  - [x] Commit con spec, plan aprobados, decisiones D-010 a D-015 y `epics.md`.
- **Verificación**: [x] `git status --short` vacío
- **Commits**: `chore(docs): reorganiza documentos y unifica README` · `docs(agents): aprueba spec y plan de concurrencia-backend`

## T2: Reloj inyectable y vencimiento exacto a los 90 s
- **Archivos**: `BookingServiceImpl.java` (modificar), `BookingServiceImplTest.java` (crear)
- **Acciones**:
  - [x] Crear la clase de pruebas con un reloj falso adelantable y escribir `hu01_retenerDisponible`, `hu01_renovar` y `hu03_otroRetieneVencida` (esta última falla hoy).
  - [x] Agregar el constructor de paquete `BookingServiceImpl(LongSupplier)`; el constructor público delega con el reloj del sistema (D4).
  - [x] Reemplazar las 4 lecturas de `System.currentTimeMillis()` por el reloj inyectado.
  - [x] Cambiar `isLockExpired` para comparar en milisegundos con `>=`: vence justo en el segundo 90.
- **Verificación**: [x] `./gradlew build` · [x] `./gradlew :server:test --tests 'co.icesi.booking.server.BookingServiceImplTest'`
- **Commit**: `refactor(server): inyecta reloj y vence la retención a los 90 s`

## T3: Exclusión mutua en las operaciones del servicio
- **Archivos**: `BookingServiceImpl.java` (modificar), `BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [x] Escribir `hu01_mismaSillaMismoInstante_ganaUno` (2, 10 y 50 hilos) y `hu01_sillasDistintas_todosGanan` con hilos soltados a la vez (`ExecutorService` y `CountDownLatch`); ver el primero en rojo.
  - [x] Marcar `synchronized` las 10 operaciones públicas del servicio (D1), conservando el `Thread.sleep(25)` de `lockSeat`.
- **Verificación**: [ ] `./gradlew build` · [ ] prueba de la clase en verde, repetida 3 veces · [ ] manual: servidor con `./gradlew runServer`, luego `./gradlew :client:runClient --args="--test-concurrency"` debe mostrar `Peticiones que creyeron ganar el bloqueo : 1`
- **Commit**: `fix(server): sincroniza el servicio para evitar la doble retención`

## T4: Consultas con estado efectivo y copias
- **Archivos**: `BookingServiceImpl.java` (modificar), `BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [x] Escribir `hu03_estadoSegunTiempo` (89 s retenida y 90 s disponible, con contadores del aforo) y `hu03_originalPierde`; verlas en rojo.
  - [x] Agregar el método privado `viewOf(Seat)` que copia la silla y la muestra disponible si su retención venció (D2, D3).
  - [x] Usar `viewOf` en `getAllSeats`, `getSeatsByZone`, `getSeat` y `getMyLockedSeats`; devolver copias en `getEventInfo` y `getMyBookings`.
- **Verificación**: [ ] `./gradlew build` · [ ] prueba de la clase en verde
- **Commit**: `fix(server): libera a la vista las retenciones vencidas y devuelve copias`

## T5: Pago todo o nada
- **Archivos**: `BookingServiceImpl.java` (modificar), `BookingServiceImplTest.java` (modificar)
- **Acciones**:
  - [x] Escribir `hu02_pagarVigentes`, `hu02_pagoDobleSimultaneo`, `hu02_dosCompradoresMismaSilla` y `hu02_sillaInvalida_noVendeNinguna` con sus 4 casos; ver en rojo los de silla no retenida.
  - [x] En `confirmBooking` validar todas las sillas antes de vender ninguna, con el orden del plan, y rechazar las disponibles con `InvalidBookingException` ("La silla X no está retenida a tu nombre.").
- **Verificación**: [ ] `./gradlew build` · [ ] prueba de la clase en verde, repetida 3 veces
- **Commit**: `fix(server): rechaza el pago de sillas no retenidas y vende todo o nada`

## T6: Cierre
- [x] `./gradlew build`, `./gradlew test` y la prueba manual `--test-concurrency` (resultado 1) en verde
- [x] `project_state.md`: quitar los defectos 1 a 5 y actualizar "Hoy"; `epics.md`: marcar HU-01 a HU-03; `decisions.md` si surgió algo nuevo
- **Commit**: `docs(agents): cierra concurrencia-backend`
- [ ] `git flow feature finish concurrencia-backend` (solo si el usuario lo pide)
