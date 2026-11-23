# Estado del proyecto

Actualizado: 2026-11-23. Lo actualiza la tarea de cierre de cada `tasks.md`.

## Hoy

- **Backend** (`codigo_base/`): compila y corre (TCP 10000 + WS 10002), con operaciones `synchronized`, estado efectivo de las retenciones y pago todo o nada. Estado en memoria: `HashMap seatsMap` y `ArrayList bookingsList` en `BookingServiceImpl`; reiniciar el servidor o `resetSeats()` lo borra todo.
- **Frontend** (`client-js/`): proyecto npm + Webpack 5 (`npm start` en el puerto 3000, `npm run build` hacia `dist/`) con conexión Ice por WebSocket al 10002. Muestra el evento, los precios y el estado de la conexión; sin conexión avisa y no reintenta. Capas `api.js` / `store.js` / `components/` / `app.js` ya creadas (ver D-016 a D-021).
- **git flow** inicializado (`master`, `develop`). `.agents/` ya está en `develop`.
- **Documentación**: un solo `README.md` en la raíz y un solo `docs/` (enunciado y wireframe); ver D-015.
- **Specs cerradas**: `concurrencia-backend`, ya en `develop` (PR #1; 12 pruebas JUnit en verde y `--test-concurrency` = 1).
- **Spec en curso**: `tooling-webpack` implementada en `feature/tooling-webpack`, verificada a mano en Chrome (HU-04 y HU-05); falta el PR a `develop`.

## Defectos conocidos del backend

Los 5 de `concurrencia-backend` quedaron corregidos. Abierto:

| # | Defecto | RF/RNF | Evidencia |
| :--- | :--- | :--- | :--- |
| 1 | `confirmBooking` no rechaza ids repetidos en el pedido: `["A-1","A-1"]` cobra la silla dos veces. Es validación de entrada, no concurrencia; se resuelve en `checkout-reservas` y al cerrarlo se borra esta fila y la mención en "Siguiente" | RF-5, RN-05 | se reproduce con un solo hilo: `confirmBooking(new String[]{"A-1","A-1"}, ...)` |

Riesgo aceptado (D-010): las llamadas se atienden de a una y cada retención exitosa ocupa el candado 25 ms; si el frontend lo nota, pasar a un candado por silla (revisar en `mapa-sillas`).

Aviso conocido del frontend: `npm run build` muestra 2 avisos de tamaño del bundle (364 KiB, casi todo la librería `ice`); no se silencian.

## Siguiente (orden sugerido de specs, una `feature/<slug>` cada uno)

1. `mapa-sillas`: aforo y retención (RF-1, RF-2, RF-7).
2. `carrito-temporizador`: cuenta regresiva y liberación (RF-3, RF-4).
3. `checkout-reservas`: pago, comprobante y mis compras (RF-5, RF-6). Incluir el defecto 1 (ids repetidos en `confirmBooking`).
4. Opcional: `despliegue-vm` (+10 %).
