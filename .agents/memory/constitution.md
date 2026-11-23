# Constitución del proyecto

Fuente: enunciado `docs/Proyecto_Reserva_Boletas_Ice_Webpack.pdf` (Computación en Internet I, Icesi, 2026-2). Si algo aquí contradice el enunciado, manda el enunciado.

## Visión

**Icesi Live Arena**: taquilla web para reservar sillas de un concierto en el Auditorio Manuelita. Muchas personas compiten a la vez por 90 sillas y nadie debe quedar con una silla vendida dos veces.

## Roles

- **Comprador**: persona que, desde el navegador, consulta el aforo, retiene sillas, las paga y consulta sus compras. Se identifica solo por su sesión (sin cuenta ni contraseña).

## Inventario y ciclo de vida

- 90 sillas: VIP 20 (filas A-B, $120.000), Platea 30 (C-E, $75.000), General 40 (F-I, $45.000). Código de silla `<Fila>-<n>`, p. ej. `A-1`.
- Estados: **Disponible** -> **Retenida** (90 segundos, exclusiva para un comprador) -> **Vendida** (irreversible, con código `RES-XXXXXXXX`).

## Requerimientos funcionales

- **RF-1** Ver información del evento, precios por zona y estado de las 90 sillas en tiempo real.
- **RF-2** Retener una silla disponible por 90 s, de forma exclusiva: dos compradores no pueden retener la misma.
- **RF-3** Ver la cuenta regresiva de cada retención; al llegar a 0 sin pagar, la silla se libera sola y vuelve a estar disponible para todos.
- **RF-4** Revisar el carrito y quitar sillas antes de que expiren, liberándolas de inmediato.
- **RF-5** Pagar con nombre y correo válido; si las retenciones siguen vigentes, las sillas quedan vendidas y se muestra el código de reserva.
- **RF-6** Consultar las compras confirmadas de la sesión.
- **RF-7** Mostrar errores (silla no disponible, retención expirada, sin conexión) sin romper la aplicación ni perder el estado.

## Requerimientos no funcionales y restricciones

- **RNF-1** Exclusión mutua en el servidor: ninguna prueba de estrés produce doble retención ni sobreventa.
- **RNF-2** Frontend en JavaScript ES6+ sin frameworks, con componentes desacoplados de responsabilidad única.
- **RNF-3** npm + Webpack: `npm start` (puerto 3000) y `npm run build` (`dist/`).
- **RNF-4** El navegador usa solo WebSocket `ws://<host>:10002` con la librería oficial `ice`; TCP 10000 queda para el cliente Java y pruebas.

## Entrega y evaluación

- Raíz del repo con `codigo_base/` (concurrencia corregida y probada) y `client-js/`.
- Historial continuo con Conventional Commits. Video de máximo 6 minutos (prueba de estrés corregida, `npm start`, flujo completo).
- Rúbrica: Tooling y Webpack 20 %, Arquitectura frontend 20 %, Integración Ice 20 %, Concurrencia 20 %, UX/temporizador/compra 20 %; despliegue en VM de la sala +10 %.
- Sustentación individual: **factor multiplicativo** sobre la nota. Todo el código debe poder explicarse; por eso las decisiones quedan en `decisions.md`.
