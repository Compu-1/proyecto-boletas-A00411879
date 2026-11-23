# Estado del proyecto

Actualizado: 2026-11-23. Lo actualiza la tarea de cierre de cada `tasks.md`.

## Hoy

- **Backend** (`codigo_base/`): compila y corre (TCP 10000 + WS 10002), con operaciones `synchronized`, estado efectivo de las retenciones y pago todo o nada. Estado en memoria: `HashMap seatsMap` y `ArrayList bookingsList` en `BookingServiceImpl`; reiniciar el servidor o `resetSeats()` lo borra todo.
- **Frontend** (`client-js/`): proyecto npm + Webpack 5 (`npm start` en el puerto 3000, `npm run build` hacia `dist/`) con conexión Ice por WebSocket al 10002. Muestra el evento, los precios, los contadores del aforo y el plano de 90 sillas con 4 estados, que se actualiza cada 1 s (D-022); un clic en una silla disponible la retiene y los rechazos salen en un aviso. Sin conexión avisa, atenúa el plano y no reintenta. Además tiene el carrito (talón "Tu boleta") con la cuenta regresiva `mm:ss` de cada silla retenida y el total, y la × para quitar una silla; las vencidas salen solas y al recargar se recuperan las vigentes. Capas `api.js` / `store.js` / `seats.js` / `components/` / `app.js` (D-016 a D-036). Aún no hay pago.
- **git flow** inicializado (`master`, `develop`). `.agents/` ya está en `develop`.
- **Documentación**: un solo `README.md` en la raíz y un solo `docs/` (enunciado y wireframe); ver D-015.
- **Specs cerradas**, ya en `develop`: `concurrencia-backend` (PR #1; 12 pruebas JUnit y `--test-concurrency` = 1), `tooling-webpack` (PR #2) y `mapa-sillas` (PR #3; 13 pruebas JUnit, verificada a mano con dos ventanas de Chrome: cambio ajeno visible en 0,9 s, vencimiento a los 90,8 s, rechazo con aviso, sin conexión a los 0,4 s y recarga con el sistema de vuelta). Lista en `feature/carrito-temporizador`, pendiente de `git flow feature finish`: 15 pruebas JUnit y verificada a mano con dos pestañas (01:29 al retener, `00:49` y `01:29` con total $165.000, quitar libera al instante, recarga recupera `01:10`, vencimiento a `00:01` sin aviso, y sin conexión la cuenta sigue y la × saca la silla).
- **Spec en curso**: `carrito-temporizador` (implementada, falta cerrar la rama); sigue `checkout-reservas` (ver "Siguiente").

## Defectos conocidos del backend

Los 5 de `concurrencia-backend` quedaron corregidos. Abierto:

| # | Defecto | RF/RNF | Evidencia |
| :--- | :--- | :--- | :--- |
| 1 | `confirmBooking` no rechaza ids repetidos en el pedido: `["A-1","A-1"]` cobra la silla dos veces. Es validación de entrada, no concurrencia; se resuelve en `checkout-reservas` y al cerrarlo se borra esta fila y la mención en "Siguiente" | RF-5, RN-05 | se reproduce con un solo hilo: `confirmBooking(new String[]{"A-1","A-1"}, ...)` |

Riesgo aceptado (D-010): las llamadas se atienden de a una y cada retención exitosa ocupa el candado 25 ms. Con 2 ventanas consultando cada 1 s no se notó; si con más ventanas la retención se siente lenta, pasar a un candado por silla.

Aviso conocido del frontend: `npm run build` muestra 2 avisos de tamaño del bundle (364 KiB, casi todo la librería `ice`); no se silencian.

## Siguiente (orden sugerido de specs, una `feature/<slug>` cada uno)

1. `checkout-reservas`: pago, comprobante y mis compras (RF-5, RF-6). Incluir el defecto 1 (ids repetidos en `confirmBooking`).
2. Opcional: `despliegue-vm` (+10 %). Al desplegar, comparar la hora (`date`) de la VM con la del navegador: la cuenta regresiva usa el reloj del navegador (D-031).
