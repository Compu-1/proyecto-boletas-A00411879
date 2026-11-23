# Plan: Carrito y temporizador de retención

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/carrito-temporizador` · **Fecha**: 2026-11-23 · **Estado**: Aprobado

## Resumen

El contrato y el servidor no cambian. El carrito sale de la misma foto de sillas que ya llega cada 1 s: son las retenidas con mi `clientId`, y `api.js` agrega a cada una su `expiresAt` (`lockTimestamp + lockDurationSeconds`). Un reloj de 250 ms en `app.js` guarda `now` en el store; `Cart` calcula el tiempo restante con `expiresAt - now`, así la cuenta baja aunque no haya conexión, y una silla con 0 s deja de ser mía en pantalla. Quitar llama a `releaseSeat` y oculta la línea al instante, aunque la llamada falle (RN-06). Recargar no necesita nada extra: el `clientId` sobrevive (D-025) y la siguiente foto trae mis sillas.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice / server | `BookingService.ice`, `BookingServiceImpl.java` | sin cambios | ya existen `releaseSeat`, `Seat.lockTimestamp` y `Seat.lockDurationSeconds` |
| test | `BookingServiceImplTest.java` | modificar | `hu10_quitarPropia_otroLaRetiene`; `hu10_quitarVencidaYaTomada_noLibera` (mi retención venció, otro la tomó: `releaseSeat` da `false` y el otro la conserva) |
| api | `client-js/src/js/api.js` | modificar | `getSeats()` agrega `expiresAt` (ms epoch, `Ice.Long` -> `toNumber()`; `0` si no está retenida); `export async function releaseSeat(seatId, clientId)` -> `void` |
| seats | `client-js/src/js/seats.js` | crear | funciones puras sin red ni DOM: `visibleState(seat, { clientId, now, releasedSeats })` (se muda de `SeatMap`), `remainingSeconds(seat, now)`, `myCart(state)` -> `[{ id, zone, price, remaining }]` ordenado por retención, `formatTime(segundos)` -> `mm:ss` |
| store | `client-js/src/js/store.js` | modificar | campos `now` (ms, lo pone el reloj) y `releasedSeats` (`Set` de ids quitados por el Comprador aún no confirmados por la foto) |
| components | `client-js/src/js/components/Cart.js` | crear | `Cart(contenedor, { onRemove })` -> `{ render(estado) }`: talón "Tu boleta", líneas `silla · zona · precio · mm:ss · ×`, corte perforado, total; vacío: "Tu carrito está vacío" sin total |
| components | `SeatMap.js`, `EventHeader.js` | modificar | usan `visibleState` de `seats.js` (con `now` y `releasedSeats`) para que plano, contadores y carrito coincidan |
| app | `client-js/src/js/app.js` | modificar | reloj `setInterval` 250 ms -> `setState({ now })`; `handleRemove(id)`; `handleSeatClick` saca el id de `releasedSeats`; `refreshSeats` limpia de `releasedSeats` las sillas que la foto ya no muestra mías |
| html | `client-js/src/index.html` | modificar | `<aside id="cart">` junto a `#seat-area` |
| css | `client-js/src/css/main.css` | modificar | `.cart__*`, dos columnas desde 900 px (talón de 320 px), solo tokens de `ui.md` |
| diseño | `.agents/designs/ui.md` | modificar | quitar la mecha (`FuseBar`): gesto 1, composición, tabla de componentes y movimiento |

## Decisiones

### D1: De dónde sale el carrito
- **Contexto**: el carrito debe mostrar mis sillas vigentes, también después de recargar (RN-07).
- **Opciones**: A) filtrar la foto de `getAllSeats()` que ya llega cada 1 s; B) llamar además `getMyLockedSeats(clientId)`; C) guardar el carrito en `sessionStorage`.
- **Elegida**: A. **Por qué**: cero llamadas nuevas, plano y carrito salen de la misma foto y no pueden contradecirse, y la recarga funciona sola. B duplica llamadas al mismo candado (D-010); C puede quedar desactualizado frente al servidor.

### D2: Cómo se calcula la cuenta regresiva
- **Contexto**: RN-02 pide máximo 2 s de diferencia con el vencimiento real, y HU-09 exige que la cuenta siga sin conexión.
- **Opciones**: A) `expiresAt` del servidor menos el reloj del navegador; B) contar 90 s desde el clic en el navegador; C) agregar la hora del servidor al contrato para corregir el desfase.
- **Elegida**: A. **Por qué**: B se rompe al recargar y con sillas retenidas antes; C cambia el contrato para un problema que no se ve en local (un solo reloj) ni en una VM con NTP. Costo aceptado: si los relojes difieren más de 2 s, la cuenta se corre (ver Riesgos).

### D3: Reloj de la interfaz
- **Contexto**: la foto llega cada 1 s más la latencia, así que si la cuenta se repintara solo con ella saltaría segundos.
- **Opciones**: A) `setInterval` de 250 ms en `app.js` que guarda `now` en el store; B) un temporizador propio dentro de `Cart`.
- **Elegida**: A. **Por qué**: un solo reloj para `Cart` y el plano; los componentes siguen sin estado propio. 4 repintados por segundo son baratos: `SeatMap` solo toca las sillas que cambian (D-029).

### D4: Vencimiento en pantalla
- **Contexto**: a los 0 s la silla debe salir del carrito sin mensaje (RN-04), aunque no haya conexión.
- **Elegida**: `visibleState` trata una silla mía con `remainingSeconds <= 0` como disponible. Carrito, plano y contadores cambian en el mismo repintado; la foto siguiente lo confirma (el servidor ya la muestra disponible, D-011). No se llama a `releaseSeat`, porque la retención vence sola.

### D5: Quitar sin esperar la confirmación
- **Contexto**: RN-06 pide que la silla salga del carrito aunque no se pueda confirmar. Además, una foto pedida antes de quitar puede llegar después y mostrarla mía otra vez por 1 s.
- **Opciones**: A) `releasedSeats` en el store: la silla queda oculta como mía desde el clic hasta que una foto la muestra no mía o el Comprador la vuelve a elegir; B) esperar la respuesta de `releaseSeat` para ocultarla.
- **Elegida**: A. **Por qué**: cumple RN-06 sin conexión y tapa la foto atrasada; B deja la línea visible si la red falla. Si `releaseSeat` falla por conexión, la taquilla pasa a sin conexión (D-028) y la silla vence sola en el servidor.

### D6: Sin botón Pagar todavía
- **Contexto**: el talón de `ui.md` tiene "Pagar", pero el pago es de `checkout-reservas`.
- **Elegida**: el talón se arma sin botón y `checkout-reservas` lo agrega con su callback, sin tocar el resto de `Cart`.

## Pruebas

| Escenario del spec | Tipo | Archivo o qué observar |
| :--- | :--- | :--- |
| HU-08: retener la primera silla | manual | retener A-1: línea `A-1 · VIP · $120.000 · 01:30` (o 01:29) y total $120.000 |
| HU-08: varias sillas con tiempos distintos | manual | retener A-1, esperar 40 s, retener F-3: `00:50` y `01:30`, total $165.000 |
| HU-08: carrito vacío | manual | servidor recién iniciado: "Tu carrito está vacío", sin total |
| HU-08: recargar con sillas retenidas | manual | retener B-4, esperar 20 s, recargar: B-4 vuelve con `01:10` (±1 s) |
| HU-09: la retención llega a cero | manual | dejar vencer D-5: sale del carrito sin aviso, plano disponible |
| HU-09: vence una de dos | manual | A-1 vence y F-3 sigue con su tiempo; total $45.000 |
| HU-09: otro comprador toma la vencida | JUnit + manual | `hu03_otroRetieneVencida` (existe); ventana 2 elige D-5 tras vencer y la ve suya |
| HU-09: vence sin conexión | manual | retener E-2, detener el servidor: la cuenta sigue y E-2 sale del carrito a los 0 s; la franja de sin conexión sigue |
| HU-10: quitar una silla | JUnit + manual | `hu10_quitarPropia_otroLaRetiene`; en el navegador, C-2 conserva su tiempo, total $75.000 y A-1 queda blanca |
| HU-10: los demás ven la silla liberada | manual | ventana 2 ve A-1 disponible en 2 s o menos |
| HU-10: volver a elegir una silla quitada | manual | quitar A-1 y elegirla de nuevo: `01:30` |
| HU-10: quitar sin conexión | JUnit + manual | `hu10_quitarVencidaYaTomada_noLibera` (quitar algo ya vencido no daña a nadie); detener el servidor y quitar B-7: sale del carrito, sigue la franja de sin conexión |

## Riesgos y pendientes

- D2: si el reloj de la VM y el del navegador difieren más de 2 s, la cuenta se corre. En el despliegue, verificar la hora con `date` en ambos; si difieren, pasar a la opción C (registrarlo como nueva decisión).
- Con el reloj local adelantado, una silla puede verse disponible un instante antes de vencer en el servidor; si el Comprador la elige, `lockSeat` la renueva para él (comportamiento correcto).
