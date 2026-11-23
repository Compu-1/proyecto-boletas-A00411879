# Convenciones del backend (Java + ZeroC Ice)

Base: apuntes Sesión 8 (sockets y concurrencia) y Sesión 9 (ZeroC Ice).

## 1. Regla de oro: contrato primero (Sesión 9)

1. Modelar el cambio en `common/src/main/slice/BookingService.ice`.
2. Compilar (`./gradlew build`): el plugin genera Java en `common/build/generated-src/BookingApp/`.
3. Programar la lógica en el servant.

- El código generado **nunca se edita**. Su paquete es `BookingApp` (nombre del módulo Slice).
- Cambiar el `.ice` rompe también al cliente web: regenerar sus stubs con `slice2js` en la misma tarea.

## 2. Piezas de Ice y dónde viven

| Pieza (Sesión 9) | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| Communicator | `BookingServerApp` | arranca Ice, propiedades, thread pool; se cierra con `try-with-resources` |
| Object Adapter | `BookingServerAdapter` en `BookingServerApp` | endpoints `default -p 10000:ws -h 0.0.0.0 -p 10002` |
| Servant | `BookingServiceImpl` | lógica de negocio e inventario en memoria |
| Proxy | `BookingServicePrx` (cliente Java) / stub `slice2js` (web) | identidad `BookingService` |

`BookingServerApp` solo configura y publica; la lógica va en el servant.

## 3. Concurrencia (Sesión 8)

- Ice atiende cada invocación en un hilo de su pool (10 a 100 hilos): **los métodos del servant corren en paralelo**, igual que el `ClientHandler` con pool de la Sesión 8.
- Todo acceso a `seatsMap` y `bookingsList` es sección crítica. Las operaciones de lectura-y-escritura (`lockSeat`, `releaseSeat`, `confirmBooking`, `resetSeats`) deben ser atómicas.
- El `Thread.sleep(25)` de `lockSeat` está marcado "No remover": se conserva. La corrección es exclusión mutua, no quitar la latencia.
- El mecanismo concreto (`synchronized`, `ReentrantLock`, colecciones concurrentes) se decide en el `plan.md` de la feature y se registra en `memory/decisions.md`.

## 4. Estilo (el del código base)

- Java estándar: `PascalCase` clases, `camelCase` métodos y variables, `UPPER_SNAKE_CASE` constantes (`DEFAULT_LOCK_DURATION_SECONDS`). 4 espacios.
- Logs de consola en español con etiqueta: `[LOCK-OK]`, `[RELEASE-OK]`, `[BOOKING-CONFIRMED]`, `[RESET]`, `[ERROR]`.
- Errores de negocio: lanzar la excepción Slice más específica (`SeatNotFoundException`, `SeatNotAvailableException`, `LockExpiredException`, `InvalidBookingException`) con mensaje en español; el cliente lo lee en `reason`.
- Tiempos en milisegundos epoch (`System.currentTimeMillis()`); duraciones de bloqueo en segundos.

## 5. Pruebas

- JUnit 4 en `server/src/test/java/co/icesi/booking/server/<Clase>Test.java`.
- El servant no usa `Current`: se prueba directo, sin levantar Ice, pasando `null` (`service.lockSeat("A-1", "C1", null)`).
- Pruebas de concurrencia: `ExecutorService` + `CountDownLatch` para disparar N hilos a la vez (mismo patrón de `runConcurrencyTest` del cliente) y verificar que exactamente uno gana.
