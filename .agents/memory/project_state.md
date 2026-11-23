# Estado del proyecto

Actualizado: 2026-11-22. Lo actualiza la tarea de cierre de cada `tasks.md`.

## Hoy

- **Backend** (`codigo_base/`): compila y corre (TCP 10000 + WS 10002), con operaciones `synchronized`, estado efectivo de las retenciones y pago todo o nada. Estado en memoria: `HashMap seatsMap` y `ArrayList bookingsList` en `BookingServiceImpl`; reiniciar el servidor o `resetSeats()` lo borra todo.
- **Frontend** (`client-js/`): no existe.
- **git flow** inicializado (`master`, `develop`). `.agents/` ya está en `develop`.
- **Documentación**: un solo `README.md` en la raíz y un solo `docs/` (enunciado y wireframe); ver D-015.
- **Specs cerradas**: `concurrencia-backend`, ya en `develop` (PR #1; 12 pruebas JUnit en verde y `--test-concurrency` = 1). Sin spec en curso.

## Defectos conocidos del backend

Los 5 de `concurrencia-backend` quedaron corregidos. Abierto:

| # | Defecto | RF/RNF | Evidencia |
| :--- | :--- | :--- | :--- |
| 1 | `confirmBooking` no rechaza ids repetidos en el pedido: `["A-1","A-1"]` cobra la silla dos veces. Es validación de entrada, no concurrencia; se resuelve en `checkout-reservas` y al cerrarlo se borra esta fila y la mención en "Siguiente" | RF-5, RN-05 | se reproduce con un solo hilo: `confirmBooking(new String[]{"A-1","A-1"}, ...)` |

Riesgo aceptado (D-010): las llamadas se atienden de a una y cada retención exitosa ocupa el candado 25 ms; si el frontend lo nota, pasar a un candado por silla (revisar en `mapa-sillas`).

## Siguiente (orden sugerido de specs, una `feature/<slug>` cada uno)

1. `tooling-webpack`: proyecto `client-js/` con Webpack y conexión Ice (Fase 1 del enunciado, RNF-3, RNF-4).
2. `mapa-sillas`: aforo y retención (RF-1, RF-2, RF-7).
3. `carrito-temporizador`: cuenta regresiva y liberación (RF-3, RF-4).
4. `checkout-reservas`: pago, comprobante y mis compras (RF-5, RF-6). Incluir el defecto 1 (ids repetidos en `confirmBooking`).
5. Opcional: `despliegue-vm` (+10 %).
