# Plan: Sillas exclusivas y sin sobreventa con compradores simultáneos

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/concurrencia-backend` · **Fecha**: 2026-11-22 · **Estado**: Aprobado

## Resumen

Todo el cambio vive en `BookingServiceImpl`. Cada operación pública se vuelve una sección crítica con `synchronized` (un solo candado: el servant). Las retenciones vencidas no se borran al leer: cada consulta devuelve **copias** de las sillas con su **estado efectivo** (vencida = disponible). El pago valida todas las sillas antes de vender ninguna. El contrato Slice no cambia, así que el cliente Java y el futuro cliente web no se tocan.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice | `codigo_base/common/src/main/slice/BookingService.ice` | sin cambios | ver D5 |
| server | `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServiceImpl.java` | modificar | ver detalle abajo |
| server | `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServerApp.java` | sin cambios | sigue usando el constructor sin parámetros |
| test | `codigo_base/server/src/test/java/co/icesi/booking/server/BookingServiceImplTest.java` | crear | 11 pruebas JUnit 4, una por escenario |
| client-java | `codigo_base/client/.../BookingClientApp.java` | sin cambios | `--test-concurrency` queda como verificación de punta a punta |

Detalle de `BookingServiceImpl`:

- `public BookingServiceImpl()` delega en `BookingServiceImpl(LongSupplier clock)` (visibilidad de paquete) con `System::currentTimeMillis`. Las 4 lecturas de `System.currentTimeMillis()` pasan a `clock.getAsLong()` (D4).
- Las 10 operaciones públicas llevan `synchronized` (D1). Los métodos privados asumen que el candado ya está tomado.
- `isLockExpired(Seat)`: compara milisegundos, `ahora - lockTimestamp >= lockDurationSeconds * 1000` (vence justo en el segundo 90; hoy vence hacia el 91).
- Nuevo privado `Seat viewOf(Seat)`: `clone()` de la silla; si está vencida, la copia sale `AVAILABLE`, con `lockedByClientId = ""` y `lockTimestamp = 0` (D2, D3).
- `getAllSeats`, `getSeatsByZone`, `getSeat`, `getMyLockedSeats`: devuelven `viewOf(...)`. `getEventInfo`: recalcula contadores y devuelve `eventInfo.clone()`. `getMyBookings`: devuelve `clone()` de cada registro.
- `lockSeat`: misma lógica (libera la vencida, renueva la propia, rechaza la ajena) y **conserva el `Thread.sleep(25)`** dentro de la sección crítica.
- `confirmBooking`: en el paso 1 agrega el rechazo de sillas `AVAILABLE` con `InvalidBookingException("La silla X no está retenida a tu nombre.")`. Orden de validación por silla: no existe; vendida; retenida vigente por otro ("bloqueada por otro comprador"); retenida por el mismo comprador pero vencida ("ha expirado"); cualquier otro caso, incluida la vencida de otro ("no está retenida a tu nombre"). Nada cambia hasta que todas pasan (RN-04).
- `releaseSeat` y `resetSeats`: solo `synchronized`.

## Decisiones

### D1: Mecanismo de exclusión mutua
- **Contexto**: Ice atiende cada llamada en un hilo de su pool (Sesión 8 y 9); `lockSeat` y `confirmBooking` hacen "revisar y luego escribir" sobre un `HashMap` compartido.
- **Opciones**: A) `synchronized` en todas las operaciones públicas. B) `ReentrantLock` explícito. C) `ConcurrentHashMap` más un candado por silla.
- **Elegida**: A — **Por qué**: es la más simple de explicar y cubre también el pago de varias sillas a la vez sin riesgo de interbloqueo. Consecuencia aceptada: las operaciones se atienden de a una; cada retención exitosa ocupa el candado 25 ms (el `sleep`), así que 90 compradores sobre 90 sillas distintas tardan en total unos 2,3 s y sobre una misma silla unos 25 ms.

### D2: Cómo se liberan las retenciones vencidas
- **Contexto**: RF-3 y RN-06 piden ver la silla disponible desde el segundo 90 en cualquier consulta.
- **Opciones**: A) Estado efectivo al leer: las consultas muestran la vencida como disponible sin modificar el inventario. B) Barrido que libera las vencidas al inicio de cada operación. C) Hilo programado que libera cada segundo.
- **Elegida**: A — **Por qué**: nadie puede observar la diferencia con una liberación real, porque toda observación pasa por una consulta. No necesita hilos extra y conserva quién tenía la silla, de modo que el pago puede responder "ha expirado" (B lo borraría y respondería "no está retenida a tu nombre"). C podría mostrarla retenida hasta 1 s de más.

### D3: Copias en lugar de las sillas internas
- **Contexto**: Ice serializa la respuesta después de que el método retorna, es decir, fuera del candado; si se devuelve la instancia interna, otro hilo puede cambiarla a mitad del envío (RN-07).
- **Opciones**: A) Devolver `clone()` (las estructuras Slice generadas ya lo traen). B) Devolver las instancias internas.
- **Elegida**: A — **Por qué**: cada respuesta es una foto coherente tomada dentro del candado.

### D4: Reloj inyectable para las pruebas
- **Contexto**: probar los segundos 89 y 90 esperando de verdad toma minutos.
- **Opciones**: A) Constructor de paquete que recibe un `LongSupplier` como reloj. B) Duración configurable (p. ej. 1 s en pruebas). C) Esperar 90 s reales.
- **Elegida**: A — **Por qué**: las pruebas adelantan el reloj a voluntad y comprueban exactamente 89 s y 90 s. `LongSupplier` es del JDK: sin dependencias nuevas.

### D5: El contrato Slice no cambia
- **Contexto**: el rechazo nuevo ("no está retenida a tu nombre") necesita una excepción.
- **Opciones**: A) Usar `InvalidBookingException`, que `confirmBooking` ya declara. B) Crear una excepción nueva en el `.ice`.
- **Elegida**: A — **Por qué**: el mensaje viaja en `reason` igual que los demás; no hay que regenerar stubs ni tocar los clientes.

## Pruebas

Todas en `BookingServiceImplTest.java`, llamando al servant directamente con `current = null` y un reloj falso (`AtomicLong`). La concurrencia usa `ExecutorService` + `CountDownLatch` para soltar todos los hilos a la vez.

| Escenario del spec | Tipo | Prueba o qué observar |
| :--- | :--- | :--- |
| HU-01: Retener una silla disponible | JUnit | `hu01_retenerDisponible`: `LOCKED`, a nombre de Ana, `expiresAt` = ahora + 90 s; otro comprador la ve `LOCKED` |
| HU-01: Misma silla en el mismo instante (2, 10, 50) | JUnit | `hu01_mismaSillaMismoInstante_ganaUno`: para cada N, exactamente 1 éxito y N-1 `SeatNotAvailableException` |
| HU-01: Misma silla (10), de punta a punta | manual | servidor + `./gradlew :client:runClient --args="--test-concurrency"` -> `Peticiones que creyeron ganar el bloqueo : 1` |
| HU-01: Sillas distintas en el mismo instante | JUnit | `hu01_sillasDistintas_todosGanan`: 10 éxitos; aforo 80 / 10 / 0 |
| HU-01: Renovar retención propia | JUnit | `hu01_renovar`: reloj +60 s, volver a retener -> `expiresAt` = ahora + 90 s |
| HU-02: Pagar retenidas y vigentes | JUnit | `hu02_pagarVigentes`: `BOOKED`, código `RES-[0-9A-F]{8}`, total 240000 |
| HU-02: Pagar dos veces en el mismo instante | JUnit | `hu02_pagoDobleSimultaneo`: 1 éxito, el otro "ya fue vendida definitivamente", `getMyBookings` con 1 registro |
| HU-02: Otro comprador paga la misma silla a la vez | JUnit | `hu02_dosCompradoresMismaSilla`: solo Ana con código; Beto sin registros |
| HU-02: Pago rechazado completo (4 filas) | JUnit | `hu02_sillaInvalida_noVendeNinguna`: por fila, mensaje esperado, A-1 sigue `LOCKED` por Ana, nada `BOOKED` |
| HU-03: Estado a los 89 s y 90 s | JUnit | `hu03_estadoSegunTiempo`: 89 s -> retenida y contada en retenidas; 90 s -> disponible y contada en disponibles |
| HU-03: Otro comprador retiene la vencida | JUnit | `hu03_otroRetieneVencida`: Beto obtiene A-1 |
| HU-03: El comprador original la pierde | JUnit | `hu03_originalPierde`: `getMyLockedSeats("Ana")` vacío |

## Riesgos y pendientes

- La sección crítica incluye el `sleep(25)` de `lockSeat`: las consultas esperan detrás de cada retención exitosa. Aceptado (D1); si el frontend lo nota, la salida es un candado por silla (revisar en `mapa-sillas`).
