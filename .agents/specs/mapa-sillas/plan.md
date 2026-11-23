# Plan: Plano de sillas en vivo y retención

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/mapa-sillas` · **Fecha**: 2026-11-23 · **Estado**: Aprobado

## Resumen

El contrato no cambia. El navegador consulta `getAllSeats()` cada 1 s y pinta las 90 sillas en un `SeatMap` nuevo. Compara `lockedByClientId` con el `clientId` de la sesión para distinguir "mía" de "retenida por otro", y `EventHeader` calcula los 3 contadores con esa misma foto. Un clic en una silla disponible llama a `lockSeat` y refresca el plano de inmediato. Los errores se muestran en un `Toast` nuevo. En el servidor solo cambia el texto del rechazo, para que diga exactamente lo que pide el spec.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice | `BookingService.ice` | sin cambios | ya tiene `getAllSeats`, `lockSeat` y `Seat.lockedByClientId` |
| server | `BookingServiceImpl.java` | modificar | `lockSeat`: mensaje de `SeatNotAvailableException` = `"La silla <id> ya no está disponible"` (D5) |
| test | `BookingServiceImplTest.java` | modificar | `hu01_mismaSillaMismoInstante_ganaUno` espera el mensaje nuevo; nueva `hu07_sillaVendida_mensaje` |
| api | `client-js/src/js/api.js` | modificar | `export async function getSeats()` -> `[{ id, zone, row, number, price, state, lockedBy }]`, con `zone` `'vip' \| 'platea' \| 'general'` y `state` `'available' \| 'locked' \| 'booked'`; `export async function lockSeat(seatId, clientId)` -> `void` |
| store | `client-js/src/js/store.js` | modificar | campos `clientId` (`WEB-XXXXXX` en `sessionStorage`, D4), `seats` (`[]` hasta la primera consulta) y `pendingSeats` (`Set` de ids en retención) |
| components | `client-js/src/js/components/SeatMap.js` | crear | `SeatMap(contenedor, { onSeatClick })` -> `{ render({ seats, clientId, pendingSeats, connection }) }`: escenario, 3 zonas con nombre y precio, filas A-I, pasillo entre la 5 y la 6, leyenda; un `<button>` por silla, y solo las disponibles y no pendientes llaman `onSeatClick(id)` |
| components | `client-js/src/js/components/EventHeader.js` | modificar | 3 contadores (Disponibles, Retenidas, Vendidas) contados desde `seats`; sin `seats` no los pinta |
| components | `client-js/src/js/components/Toast.js` | crear | `Toast(contenedor)` -> `{ show(mensaje) }`; se oculta a los 4 s y un mensaje nuevo reemplaza al anterior |
| app | `client-js/src/js/app.js` | modificar | `refreshSeats()` con descarte de respuestas viejas (D2); ciclo cada 1 s que se detiene al quedar sin conexión; `handleSeatClick(id)`: `pendingSeats` -> `lockSeat` -> `refreshSeats()`; un error de negocio va al `Toast` y uno de conexión deja `connection: 'offline'` |
| html | `client-js/src/index.html` | modificar | agrega `<div id="toast">`; el plano usa el `#seat-area` que ya existe |
| css | `client-js/src/css/main.css` | modificar | `.seat-map__*` (`--available`, `--mine`, `--other`, `--booked`, `--offline` con opacidad 40 %), `.event-header__counter*`, `.toast*`; solo tokens existentes |
| diseño | `.agents/designs/ui.md` | modificar | silla "Tuya": clic = nada (RN-06); contador "Libres" pasa a "Disponibles" |

## Decisiones

### D1: Cómo se mantiene el plano al día (RN-04, ≤ 2 s)
- **Contexto**: otros compradores cambian sillas y el plano debe mostrarlo en máximo 2 s.
- **Opciones**: A) consultar `getAllSeats()` cada 1 s; B) aviso del servidor (callback bidireccional de Ice) a cada navegador; C) consultar cada 2 s.
- **Elegida**: A. **Por qué**: no cambia el contrato y es fácil de explicar. En el peor caso el cambio se ve en 1 s más la latencia de la respuesta (C pasaría de 2 s). Cada ciclo agenda el siguiente con `setTimeout` solo cuando termina, así nunca hay dos consultas del ciclo a la vez. Costo aceptado: 1 llamada por segundo por ventana, cada una con 90 copias bajo el candado de D-010.

### D2: Respuestas que llegan desordenadas
- **Contexto**: una consulta del ciclo enviada antes de retener puede llegar después del refresco posterior y mostrar "A-1" disponible por 1 s.
- **Opciones**: A) numerar cada consulta y aplicar solo la respuesta más nueva; B) pausar el ciclo mientras se retiene; C) aceptar el parpadeo.
- **Elegida**: A. **Por qué**: son 3 líneas (`const ticket = ++lastRequest; if (ticket < lastApplied) return;`). El servidor atiende de a una llamada, así que una consulta enviada después de retener ya incluye la retención.

### D3: Contadores desde la misma foto de sillas
- **Contexto**: RN-03 exige que Disponibles + Retenidas + Vendidas = 90.
- **Opciones**: A) contarlos en `EventHeader` a partir de `seats`; B) pedir `getEventInfo()` en cada ciclo.
- **Elegida**: A. **Por qué**: una sola llamada por ciclo y los contadores siempre coinciden con el plano que se ve. Con B serían dos fotos tomadas en momentos distintos.

### D4: Identidad del Comprador y "mía"
- **Contexto**: hay que distinguir "mía" de "retenida por otro".
- **Elegida**: `clientId` `WEB-` + 6 caracteres aleatorios, guardado en `sessionStorage` (`conventions/frontend.md`). Una silla es "mía" si `state === 'locked' && lockedBy === clientId`. Una retención vencida ya llega disponible del servidor (D-011). **Consecuencia**: al recargar en la misma pestaña se conserva el `clientId`. Cómo lo muestra el carrito queda para `carrito-temporizador`.

### D5: Texto del rechazo
- **Contexto**: el servidor dice "La silla B-3 ya no se encuentra disponible (Estado: LOCKED)." y el spec pide "La silla B-3 ya no está disponible".
- **Opciones**: A) cambiar el texto en el servidor; B) que el navegador arme el texto según el tipo de excepción.
- **Elegida**: A. **Por qué**: los mensajes de negocio salen del servidor (`conventions/backend.md`) y `api.js` ya muestra `reason` tal cual. El cliente Java también imprime `reason`, así que no hay que tocarlo.

### D6: Clic en silla propia o pendiente (RN-06)
- **Contexto**: `lockSeat` del mismo cliente renueva los 90 s, y RN-06 prohíbe eso.
- **Elegida**: `SeatMap` no llama a `onSeatClick` para sillas mías, retenidas por otro, vendidas ni pendientes, ni cuando no hay conexión. `pendingSeats` evita que un doble clic mande dos `lockSeat`. El servidor no cambia: renovar sigue siendo legítimo para el cliente Java.

## Pruebas

| Escenario del spec | Tipo | Archivo o qué observar |
| :--- | :--- | :--- |
| HU-06: abrir con todo disponible | manual | servidor recién iniciado; 3 zonas, filas A-I, 10 por fila, 90 blancas; contadores 90/0/0 |
| HU-06: cuatro estados | manual | ventana 1 retiene A-1; ventana 2 retiene A-2; vender A-3 con `:client:runClient`; ventana 1 ve roja, punteada y gris, y contadores 87/2/1 |
| HU-06: cambio de otro comprador | manual | ventana 2 retiene C-4; ventana 1 la ve punteada en ≤ 2 s (cronómetro) y Disponibles baja en 1 |
| HU-06: retención de otro vence | JUnit + manual | `hu03_estadoSegunTiempo` (ya existe); ventana 1 ve C-5 blanca ≤ 2 s después de los 90 s |
| HU-06: se pierde la conexión | manual | detener servidor; aviso en ≤ 10 s, plano al 40 % con el último estado y contadores intactos |
| HU-07: retener disponible | JUnit + manual | `hu01_retenerDisponible`; A-1 roja en la ventana 1 y punteada en la 2 en ≤ 2 s |
| HU-07: silla que ya tomó otro | JUnit + manual | `hu07_sillaVendida_mensaje` y `hu01_mismaSillaMismoInstante_ganaUno` con el texto nuevo; a mano, retener B-3 con `:client:runClient` y hacer clic en la ventana antes de 1 s: `Toast` "La silla B-3 ya no está disponible" |
| HU-07: dos al mismo tiempo | JUnit + verificación | `hu01_mismaSillaMismoInstante_ganaUno`; `--test-concurrency` = 1 |
| HU-07: silla que ya es suya | manual | clic en A-1 propia a los 30 s: sin `[LOCK-OK]` nuevo en el log y la ventana 2 la ve libre a los 90 s del primer clic |
| HU-07: sin conexión | manual | detener servidor; clic en D-2 no hace nada, se ve el aviso y D-2 no queda roja |

## Riesgos y pendientes

- D-010: con muchas ventanas, cada consulta compite por el mismo candado que `lockSeat` (25 ms). Con 2 o 3 ventanas de la demo no se nota; si se nota, cambiar a un candado por silla.
- Escenario "silla que ya tomó otro": en una demo con el plano refrescando cada 1 s es difícil hacer clic antes de verla punteada; la prueba JUnit es la evidencia principal.
