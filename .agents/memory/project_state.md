# Estado del proyecto

Actualizado: 2026-11-23. Lo actualiza la tarea de cierre de cada `tasks.md`.

## Hoy

- **Backend** (`codigo_base/`): compila y corre (TCP 10000 + WS 10002), con operaciones `synchronized`, estado efectivo de las retenciones y pago todo o nada. `confirmBooking` valida nombre, correo (`EMAIL_PATTERN`) y sillas repetidas con los textos de la taquilla (D-037). Estado en memoria: `HashMap seatsMap` y `ArrayList bookingsList` en `BookingServiceImpl`; reiniciar el servidor o `resetSeats()` lo borra todo.
- **Frontend** (`client-js/`): proyecto npm + Webpack 5 (`npm start` en el puerto 3000, `npm run build` hacia `dist/`) con conexión Ice por WebSocket al 10002. Muestra el evento, los precios, los contadores del aforo y el plano de 90 sillas con 4 estados, que se actualiza cada 1 s (D-022); un clic en una silla disponible la retiene y los rechazos salen en un aviso. Sin conexión avisa, atenúa el plano y no reintenta. Además tiene el carrito (talón "Tu boleta") con la cuenta regresiva `mm:ss` de cada silla retenida y el total, y la × para quitar una silla; las vencidas salen solas y al recargar se recuperan las vigentes. El botón Pagar abre un `<dialog>` blanco con el resumen congelado, nombre y correo (D-038 a D-040); al pagar sale el comprobante con el código `RES-` y la sección "Mis compras" bajo el talón lista las compras de la sesión (D-041, D-042). Capas `api.js` / `store.js` / `seats.js` / `components/` / `app.js` (D-016 a D-042).
- **git flow** inicializado (`master`, `develop`). `.agents/` ya está en `develop`.
- **Documentación**: un solo `README.md` en la raíz y un solo `docs/` (enunciado y wireframe); ver D-015.
- **Specs cerradas**, ya en `develop`: `concurrencia-backend` (PR #1; 12 pruebas JUnit y `--test-concurrency` = 1), `tooling-webpack` (PR #2) `mapa-sillas` (PR #3; 13 pruebas JUnit, verificada a mano con dos ventanas de Chrome: cambio ajeno visible en 0,9 s, vencimiento a los 90,8 s, rechazo con aviso, sin conexión a los 0,4 s y recarga con el sistema de vuelta) y `carrito-temporizador` (PR #4; 15 pruebas JUnit y verificada a mano con dos pestañas). Lista en `feature/checkout-reservas`, pendiente de PR hacia `develop`: 21 pruebas JUnit, `--test-concurrency` = 1 y verificada a mano con dos pestañas (nombre vacío y `ana.correo.com` con su error y datos conservados; pago de A-1 y F-3 con `RES-` + 8 y $165.000, vendidas en la otra pestaña; doble clic en Confirmar da una sola compra; B-1 vencida rechaza todo y el resumen pasa a F-5; sin sillas "Elige al menos una silla para pagar"; segundo pago con código distinto; recarga conserva "Mis compras"; servidor detenido muestra sin conexión y B-7 sigue en el carrito).
- **Despliegue** (`deploy/`, spec `despliegue-vm`, lista en `feature/despliegue-vm`): `./deploy/package.sh` arma `deploy/build/icesi-live-arena.tar.gz` (`server.jar` con Ice, `dist/`, `install.sh`, sitio de Nginx y servicio `systemd`); en la VM, `sudo ./install.sh` instala Java 17 y Nginx si faltan y deja la taquilla en `http://<ip>` (Nginx en el 80, `/ws` -> 10002). Verificada en Multipass (Ubuntu 24.04) desde VM limpia: instalación en 35 s y repetible, ruta profunda, cambio ajeno en 0,8 s, compra `RES-` con $165.000, cuenta desde 01:29 y liberación a los 90,8 s, sin conexión al detener el servicio, reinicio tras `kill -9` en 3,3 s y tras reiniciar la VM en 12,9 s.
- **Spec en curso**: ninguna.

## Defectos conocidos del backend

Ninguno abierto: los 5 de `concurrencia-backend` y el de ids repetidos en `confirmBooking` (cerrado en `checkout-reservas`) están corregidos.

Riesgo aceptado (D-010): las llamadas se atienden de a una y cada retención exitosa ocupa el candado 25 ms. Con 2 ventanas consultando cada 1 s no se notó; si con más ventanas la retención se siente lenta, pasar a un candado por silla.

Aviso conocido del frontend: `npm run build` muestra los avisos de tamaño del bundle (379 KiB, casi todo la librería `ice`); no se silencian.

## Siguiente (orden sugerido de specs, una `feature/<slug>` cada uno)

1. En la sala: copiar el paquete a la VM y seguir la sección "Deployment on a VM" del README; comparar `date` de la VM con el equipo (D-031) y abrir la taquilla desde dos equipos. Luego marcar HU-14 y HU-15 en `epics.md`.
