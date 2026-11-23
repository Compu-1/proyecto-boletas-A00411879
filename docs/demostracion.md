# Demostración y prueba manual

Recorrido para comprobar Icesi Live Arena de punta a punta: el servidor y su prueba de concurrencia, el empaquetado con Webpack y el flujo completo de un comprador, desde retener sillas hasta recibir el código de reserva.

Video de este recorrido: [`video-demostracion.mp4`](video-demostracion.mp4).

## Requisitos

- JDK 17 e Ice 3.7 con `slice2java` instalado.
- Node 22 o superior, con `npm install` ya ejecutado en `client-js/`.
- Chrome u otro navegador moderno.
- Un servidor recién iniciado: el inventario y las compras viven en memoria, así que arrancar de nuevo deja las 90 sillas disponibles y "Mis compras" vacía.

## Preparación

Se usan tres terminales:

```bash
# Terminales 1 y 2 (backend)
export JAVA_HOME=$(/usr/libexec/java_home -v 17) ICE_HOME=/opt/homebrew
cd codigo_base

# Terminal 3 (frontend)
cd client-js
```

## 1. Servidor

```bash
# Terminal 1
./gradlew runServer
```

**Resultado esperado**: el servidor queda escuchando en TCP 10000 (cliente Java y pruebas) y en WebSocket 10002 (navegador).

## 2. Prueba de concurrencia

```bash
# Terminal 2
./gradlew :client:runClient --args="--test-concurrency"
```

Lanza 10 hilos que intentan retener la silla `A-1` en el mismo instante.

**Resultado esperado**:

```text
Peticiones que creyeron ganar el bloqueo : 1
```

Un solo hilo obtiene la silla y los otros 9 son rechazados. En el log del servidor aparece un único `[LOCK-OK]` para `A-1`. La exclusión mutua está en `BookingServiceImpl`: todas sus operaciones son `synchronized`, y la latencia simulada `Thread.sleep(25)` de `lockSeat` se conserva.

## 3. Pruebas automáticas

```bash
# Terminal 2
./gradlew :server:test
```

**Resultado esperado**: `BUILD SUCCESSFUL`, con las 21 pruebas JUnit de `BookingServiceImplTest`. Cubren la retención exclusiva, el vencimiento, quitar sillas, el pago todo o nada, la validación de datos y las compras de cada comprador.

## 4. Frontend con Webpack

```bash
# Terminal 3
npm start
```

**Resultado esperado**: primero se generan las clases de Ice desde `BookingService.ice` (`prestart`) y luego Webpack muestra `compiled successfully`. La aplicación queda en `http://localhost:3000`.

Se abre la página en **dos ventanas** del navegador, una al lado de la otra. Cada pestaña es un comprador distinto (A y B), porque el identificador del comprador se guarda por pestaña.

> Si se ejecutó la prueba de concurrencia, `A-1` aparece con borde punteado (retenida por otro comprador) durante 90 s: la retuvo el cliente Java.

## 5. Recorrido del comprador

La liberación automática tarda 90 s. Para observarla sin detener el recorrido, al comenzar se retiene la silla `H-1` en el comprador **B** y se revisa en el paso 6.

| # | Acción | Resultado esperado |
| :-- | :--- | :--- |
| 1 | En **A**, retener `B-1` y `F-3` | El talón "Tu boleta" muestra `B-1 · VIP · $120.000` y `F-3 · General · $45.000`, cada una con su cuenta regresiva desde `01:30`, y el total `$165.000` |
| 2 | Observar **B** | En máximo 2 s, `B-1` y `F-3` aparecen retenidas por otro (borde punteado) y no se pueden elegir; los contadores del encabezado cambian en ambas ventanas |
| 3 | En **A**, quitar `F-3` con la × | `F-3` sale del talón, el total baja a `$120.000` y `B-1` conserva su tiempo; en **B**, `F-3` vuelve a estar disponible |
| 4 | En **A**, pulsar Pagar y confirmar con el nombre vacío | Se abre el panel de pago con el resumen; aparece "Escribe tu nombre" y la silla sigue retenida |
| 5 | Escribir el nombre `Ana Pérez` y el correo `ana@correo` y confirmar | Aparece "Escribe un correo válido"; los datos escritos se conservan |
| 6 | Observar **B** | `H-1` llegó a `00:00`, salió sola de su talón y aparece disponible en ambas ventanas |
| 7 | En **A**, corregir el correo a `ana@correo.com` y confirmar | Se muestra el comprobante con el código `RES-` y 8 caracteres, la silla con zona y precio, el total, el nombre y el correo; el talón queda vacío |
| 8 | Observar **B** | `B-1` aparece vendida y no se puede elegir |
| 9 | En **A**, cerrar el comprobante | "Mis compras" muestra la compra con su código, sillas, total, nombre y correo |
| 10 | En **A**, recargar la página | "Mis compras" conserva la compra |

## 6. Sin conexión (opcional)

Con una silla retenida en **A**, se detiene el servidor (`Ctrl+C` en la terminal 1).

**Resultado esperado**: aparece la franja roja "Sin conexión con la taquilla. Recarga la página para intentar de nuevo.", el plano se atenúa, la cuenta regresiva sigue bajando, y si se intenta pagar se muestra el mismo aviso sin perder el carrito.

## 7. Build de producción (opcional)

```bash
# Terminal 3, con el servidor encendido
npm run build
python3 -m http.server 8080 -d dist
```

**Resultado esperado**: `compiled` (con los avisos de tamaño que se deben a la librería `ice`) y la misma aplicación servida desde `dist/` en `http://localhost:8080`.
