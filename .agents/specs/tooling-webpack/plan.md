# Plan: Abrir la taquilla en el navegador y ver el evento

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/tooling-webpack` · **Fecha**: 2026-11-22 · **Estado**: Aprobado

## Resumen

Se crea `client-js/` con npm y Webpack 5 según la Sesión 12 y `conventions/frontend.md`. Al cargar, `app.js` pide a `api.js` la información del evento (`getEventInfo`) por WebSocket en el puerto 10002, la guarda en `store.js` y la pintan dos componentes: `EventHeader` (evento y precios) y `ConnectionBanner` (estado "Conectado" o el aviso sin conexión). La caída del sistema se detecta con el aviso de cierre de la conexión Ice y cada llamada tiene un límite de 10 s. El backend y el contrato Slice no cambian.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice | `codigo_base/common/src/main/slice/BookingService.ice` | sin cambios | se compila a JS con `slice2js` (D1) |
| server | `BookingServerApp.java` | sin cambios | ya publica `ws -h 0.0.0.0 -p 10002` |
| tooling | `client-js/package.json` | crear | scripts `slice`, `prestart`, `prebuild`, `start`, `build`; dependencias de D4 |
| tooling | `client-js/webpack.config.js` | crear | `entry ./src/js/app.js`; `output dist/bundle.[contenthash:8].js`, `clean: true`; `HtmlWebpackPlugin` con `src/index.html`; `style-loader` + `css-loader`; dev server puerto 3000 |
| tooling | `.gitignore` (raíz) | modificar | `client-js/node_modules/`, `client-js/dist/`, `client-js/src/js/generated/` |
| html | `client-js/src/index.html` | crear | esqueleto semántico: `header` del evento, franja de conexión, `main` vacío para `mapa-sillas` |
| api | `client-js/src/js/api.js` | crear | `export async function connect({ onDisconnect })`; `export async function getEventInfo()` -> `{ name, date, venue, prices: { vip, platea, general } }`; errores Ice -> `Error` con `reason` |
| store | `client-js/src/js/store.js` | crear | estado `{ connection: 'connecting' \| 'online' \| 'offline', event: null \| {...} }`; `getState()`, `setState(cambios)`, `subscribe(fn)` |
| format | `client-js/src/js/format.js` | crear | `export function formatPrice(valor)` -> `"$120.000"` (RN-02) |
| components | `client-js/src/js/components/EventHeader.js` | crear | `EventHeader(contenedor)` -> `{ render(estado) }`: marca, nombre, fecha, lugar y 3 precios; sin evento no pinta datos |
| components | `client-js/src/js/components/ConnectionBanner.js` | crear | `ConnectionBanner(contenedor)` -> `{ render(estado) }`: "Conectado" discreto, o franja roja con el mensaje del spec |
| app | `client-js/src/js/app.js` | crear | arma componentes, `subscribe` al store, llama `connect` y `getEventInfo` con `try/catch`; `onDisconnect` pone `offline` sin borrar `event` (RN-06) |
| css | `client-js/src/css/main.css` | crear | tokens de `designs/ui.md` en `:root`; clases `.event-header__*`, `.connection-banner--online/--offline` |
| docs | `README.md`, `.agents/designs/ui.md` | modificar | comandos de `client-js/`; texto del `ConnectionBanner` sin "REINTENTANDO" (D3) |

## Decisiones

### D1: Cómo se obtienen las clases Slice en JavaScript
- **Contexto**: `slice2js` no está instalado en la máquina; el navegador necesita `BookingApp.BookingServicePrx` generado desde el mismo `.ice`.
- **Opciones**: A) paquete npm `slice2js` (dev) con script `slice` que se ejecuta solo en `prestart` y `prebuild`; la salida se ignora en git. B) Generar una vez y versionar `src/js/generated/`. C) Instalar `slice2js` global con Homebrew.
- **Elegida**: A — **Por qué**: el contrato tiene una sola fuente (`BookingService.ice`), `npm start` siempre usa la versión vigente y nadie puede editar el generado por error. Costo: `npm start` tarda un instante más.

### D2: Detectar la falta de conexión en máximo 10 s (RN-04)
- **Contexto**: HU-05 pide avisar al abrir con el sistema apagado y cuando se apaga con la taquilla abierta, sin reintentar.
- **Opciones**: A) Aviso de cierre de la conexión Ice (`setCloseCallback`) más límite de 10 s por llamada (`ice_invocationTimeout(10000)`). B) `ice_ping` cada 5 s. C) Heartbeats ACM.
- **Elegida**: A — **Por qué**: apagar el servidor cierra el socket y el aviso llega al instante, sin tráfico extra; el límite cubre una llamada que se queda colgada. Costo aceptado: si la red se corta sin cerrar el socket, se nota en la siguiente llamada (lo retoma `mapa-sillas`, que consultará el aforo periódicamente).

### D3: Indicador "Conectado" y aviso en un solo componente
- **Contexto**: `designs/ui.md` define `ConnectionBanner` con el texto "REINTENTANDO", pero RN-05 prohíbe reintentar.
- **Opciones**: A) `ConnectionBanner` pinta los dos estados y su texto pasa a ser el del spec. B) Indicador dentro de `EventHeader` y banner aparte.
- **Elegida**: A — **Por qué**: un componente, una responsabilidad (estado de la conexión). Se corrige `ui.md` para que diga lo mismo que el spec.

### D4: Dependencias npm nuevas (a confirmar)
- **Contexto**: el enunciado exige npm + Webpack; el proyecto aún no tiene `package.json`.
- **Opciones**: A) Las del enunciado con versión exacta: `ice` 3.7.110 (dependencia); `webpack` 5, `webpack-cli`, `webpack-dev-server`, `html-webpack-plugin`, `style-loader`, `css-loader`, `slice2js` 3.7.110 (desarrollo). B) Agregar un servidor estático para probar `dist/`.
- **Elegida**: A — **Por qué**: es la lista del enunciado más `slice2js` (D1). Para abrir `dist/` basta `python3 -m http.server`, sin otra dependencia. `ice` y `slice2js` quedan en 3.7.x como el servidor.

## Pruebas

Sin pruebas automáticas en el frontend (D-007). Antes de cada verificación: `./gradlew runServer` en `codigo_base/`.

| Escenario del spec | Tipo | Qué observar |
| :--- | :--- | :--- |
| HU-04: Abrir la taquilla, versión desarrollo | manual | `npm start`, abrir `http://localhost:3000`: nombre, fecha, lugar, $120.000 / $75.000 / $45.000 y "Conectado"; consola sin errores |
| HU-04: Abrir la taquilla, versión entrega | manual | `npm run build`, `python3 -m http.server 8080 -d dist`, abrir `http://localhost:8080`: lo mismo que en desarrollo |
| HU-04: Dos compradores a la vez | manual | dos ventanas recargadas a la vez: mismos datos y "Conectado" en ambas |
| HU-05: Abrir con el sistema apagado | manual | servidor detenido; abrir: mensaje del spec en menos de 10 s y sin precios |
| HU-05: El sistema se apaga con la taquilla abierta | manual | con la página abierta, detener el servidor (Ctrl+C): mensaje en menos de 10 s, evento y precios siguen visibles, sin "Conectado" |
| HU-05: Recargar cuando el sistema volvió | manual | levantar el servidor y recargar: evento, precios y "Conectado"; sin mensaje |
| RN-01: datos del sistema | revisión | `grep -rn "120000\|Manuelita" client-js/src` vacío: nada escrito a mano |

## Riesgos y pendientes

- El paquete `ice` 3.7 publica `main: src/index.js` y en Node usa módulos propios del servidor (`net`); Webpack 5 no los incluye. La primera tarea es una prueba mínima de conexión; si falla el bundle, se ajusta `resolve.fallback` en `webpack.config.js` y se anota en `decisions.md`.
- El código de `slice2js` 3.7 es CommonJS; se importa con `import` por la interoperabilidad de Webpack. Se valida en la misma prueba mínima.
- Node 25 está instalado; si Webpack 5 falla con esa versión, se usa la LTS (22) con `nvm` y se anota en `stack.md`.
