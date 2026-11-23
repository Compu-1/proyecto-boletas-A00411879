# Épicas e historias de usuario

Registro de HU. Lo actualiza `c-specify` al aprobar un spec (siguiente número libre) y `c-task` al cerrar. Marcar `[x]` solo cuando la HU está en `develop` y verificada.

| HU | Título | RF | Spec | Estado |
| :--- | :--- | :--- | :--- | :--- |
| HU-01 | Retener una silla en exclusiva | RF-2, RNF-1 | [concurrencia-backend](../specs/concurrencia-backend/spec.md) | [x] |
| HU-02 | Pagar sin sobreventa | RF-5, RNF-1 | [concurrencia-backend](../specs/concurrencia-backend/spec.md) | [x] |
| HU-03 | Liberar automáticamente las retenciones vencidas | RF-3 | [concurrencia-backend](../specs/concurrencia-backend/spec.md) | [x] |
| HU-04 | Abrir la taquilla y ver el evento | RF-1, RNF-3, RNF-4 | [tooling-webpack](../specs/tooling-webpack/spec.md) | [x] |
| HU-05 | Saber que no hay conexión con la taquilla | RF-7, RNF-4 | [tooling-webpack](../specs/tooling-webpack/spec.md) | [x] |
| HU-06 | Ver el plano de sillas y el aforo en vivo | RF-1 | [mapa-sillas](../specs/mapa-sillas/spec.md) | [x] |
| HU-07 | Retener una silla desde el plano | RF-2, RF-7, RNF-1 | [mapa-sillas](../specs/mapa-sillas/spec.md) | [x] |
| HU-08 | Ver mis sillas retenidas con su cuenta regresiva | RF-3, RF-4 | [carrito-temporizador](../specs/carrito-temporizador/spec.md) | [x] |
| HU-09 | Liberar sola una silla cuando vence su tiempo | RF-3 | [carrito-temporizador](../specs/carrito-temporizador/spec.md) | [x] |
| HU-10 | Quitar una silla de mi carrito | RF-4, RF-7 | [carrito-temporizador](../specs/carrito-temporizador/spec.md) | [x] |
| HU-11 | Pagar mis sillas con nombre y correo | RF-5, RF-7 | [checkout-reservas](../specs/checkout-reservas/spec.md) | [x] |
| HU-12 | Recibir mi comprobante con el código de reserva | RF-5, RNF-1 | [checkout-reservas](../specs/checkout-reservas/spec.md) | [x] |
| HU-13 | Consultar mis compras | RF-6 | [checkout-reservas](../specs/checkout-reservas/spec.md) | [x] |
| HU-14 | Usar la taquilla desde otro equipo de la sala | RF-1 a RF-7, RNF-1, RNF-4 | [despliegue-vm](../specs/despliegue-vm/spec.md) | [ ] |
| HU-15 | Encontrar la taquilla disponible aunque la VM se reinicie | RF-1, RF-7 | [despliegue-vm](../specs/despliegue-vm/spec.md) | [ ] |
