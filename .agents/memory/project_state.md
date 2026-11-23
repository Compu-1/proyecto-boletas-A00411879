# Estado del proyecto

Actualizado: 2026-11-22. Lo actualiza la tarea de cierre de cada `tasks.md`.

## Hoy

- **Backend** (`codigo_base/`): compila y corre (TCP 10000 + WS 10002). Estado en memoria: `HashMap seatsMap` y `ArrayList bookingsList` en `BookingServiceImpl`; reiniciar el servidor o `resetSeats()` lo borra todo.
- **Frontend** (`client-js/`): no existe.
- **git flow** inicializado (`master`, `develop`). `.agents/` ya está en `develop`.
- **Documentación**: un solo `README.md` en la raíz y un solo `docs/` (enunciado y wireframe); ver D-015.
- **Spec en curso**: `concurrencia-backend` (spec y plan aprobados; falta `c-task`).

## Defectos conocidos del backend

| # | Defecto | RF/RNF | Evidencia |
| :--- | :--- | :--- | :--- |
| 1 | `lockSeat` sin exclusión mutua (check-then-act + `Thread.sleep(25)`): 10 de 10 hilos ganan la misma silla | RNF-1 | `--test-concurrency` reporta 10 (2026-11-22) |
| 2 | `confirmBooking` valida y marca `BOOKED` en dos pasos no atómicos | RNF-1 | `BookingServiceImpl.confirmBooking` |
| 3 | `confirmBooking` acepta sillas `AVAILABLE` que el comprador nunca retuvo | RF-5 | solo rechaza `BOOKED` y retenidas por otro |
| 4 | Expiración perezosa: `getAllSeats`, `getSeatsByZone` y `getSeat` devuelven `LOCKED` aunque el bloqueo ya venció | RF-1, RF-3 | `isLockExpired()` solo se usa en lock/release/confirm/getMyLockedSeats/contadores |
| 5 | Los getters devuelven las instancias internas de `Seat` (mutables), no copias | RNF-1 | `getAllSeats`, `getSeat` |

## Siguiente (orden sugerido de specs, una `feature/<slug>` cada uno)

1. `concurrencia-backend`: defectos 1 a 5 (RNF-1, RF-3 en servidor, RF-5).
2. `tooling-webpack`: proyecto `client-js/` con Webpack y conexión Ice (Fase 1 del enunciado, RNF-3, RNF-4).
3. `mapa-sillas`: aforo y retención (RF-1, RF-2, RF-7).
4. `carrito-temporizador`: cuenta regresiva y liberación (RF-3, RF-4).
5. `checkout-reservas`: pago, comprobante y mis compras (RF-5, RF-6).
6. Opcional: `despliegue-vm` (+10 %).
