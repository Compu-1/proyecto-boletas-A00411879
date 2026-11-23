# Tareas: Abrir la taquilla en el navegador y ver el evento

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/tooling-webpack` · **Fecha**: 2026-11-22

Comandos de `client-js/` desde esa carpeta; para verificar contra el sistema real, `./gradlew runServer` en `codigo_base/` (con `JAVA_HOME` e `ICE_HOME` exportados, ver `conventions/stack.md`). Sin pruebas automáticas en el frontend (D-007): cada tarea dice qué observar.

## Resumen

- [x] T1: Documentos del spec en la rama
- [x] T2: Proyecto npm con Webpack y página vacía
- [x] T3: Clases Slice y conexión por WebSocket
- [x] T4: Estado y formato de precios (paralela con T3)
- [ ] T5: Componentes del encabezado y de la conexión
- [ ] T6: Conexión de todo y aviso sin conexión
- [ ] T7: Cierre

## T1: Documentos del spec en la rama
- **Rama**: ya creada con `git flow feature start tooling-webpack`
- **Archivos**: `.agents/specs/tooling-webpack/` (spec, plan, tasks), `.agents/memory/decisions.md`, `.agents/memory/epics.md`
- **Acciones**:
  - [x] Commit con spec y plan aprobados, tareas, decisiones D-016 a D-019 y HU-04 y HU-05 en `epics.md`.
- **Verificación**: [ ] `git status --short` vacío
- **Commit**: `docs(agents): aprueba spec y plan de tooling-webpack`

## T2: Proyecto npm con Webpack y página vacía
- **Archivos**: `client-js/package.json`, `client-js/webpack.config.js`, `client-js/src/index.html`, `client-js/src/css/main.css`, `client-js/src/js/app.js` (crear); `.gitignore` (modificar)
- **Acciones**:
  - [x] Crear `package.json` con los scripts `start` y `build` y las dependencias de D-019 (sin `ice` ni `slice2js` aún); instalar con `npm install` y versionar `package-lock.json`.
  - [x] Escribir `webpack.config.js` con los 4 pilares de `conventions/frontend.md` y dev server en el puerto 3000.
  - [x] Crear `index.html` semántico (cabecera, franja de conexión, `main` vacío), `main.css` con los tokens de `designs/ui.md` en `:root` y un `app.js` que solo importa el CSS.
  - [x] Ignorar en `.gitignore` `client-js/node_modules/` y `client-js/dist/`.
- **Verificación**: [ ] `npm run build` genera `dist/` · [ ] manual: `npm start` y `http://localhost:3000` muestra la página negra sin errores en consola; si Webpack falla con Node 25, probar con Node 22 y anotarlo en `stack.md`
- **Commit**: `chore(client-js): crea proyecto npm con Webpack`

## T3: Clases Slice y conexión por WebSocket
- **Archivos**: `client-js/package.json`, `client-js/src/js/api.js` (crear/modificar); `client-js/webpack.config.js` (modificar si hace falta); `.gitignore` (modificar)
- **Acciones**:
  - [x] Agregar `ice` y `slice2js` y el script `slice` (genera `src/js/generated/` desde el `.ice`), enganchado en `prestart` y `prebuild`; ignorar `client-js/src/js/generated/`.
  - [x] Crear `api.js` con `connect({ onDisconnect })` (Communicator, proxy `ws -h <hostname> -p 10002`, límite de 10 s por llamada y aviso de cierre) y `getEventInfo()` que devuelve `{ name, date, venue, prices }`; los errores Slice se traducen a `Error` con el `reason`.
  - [x] Llamar a ambas desde `app.js` solo para registrar el resultado en consola (prueba mínima del riesgo del plan); si el bundle falla por módulos de Node, ajustar `resolve.fallback` y registrarlo en `decisions.md`.
- **Verificación**: [ ] `npm run build` · [ ] manual: con el servidor encendido, `npm start` y la consola muestra el evento "Concierto Icesi Live Rock & Pop 2026"
- **Commit**: `feat(client-js): conecta con el servidor por WebSocket`

## T4: Estado y formato de precios (paralela con T3)
- **Archivos**: `client-js/src/js/store.js`, `client-js/src/js/format.js` (crear)
- **Acciones**:
  - [x] Crear `store.js` con estado inicial `{ connection: 'connecting', event: null }` y `getState`, `setState`, `subscribe`.
  - [x] Crear `format.js` con `formatPrice(valor)` que devuelve pesos con punto de miles y sin decimales.
- **Verificación**: [ ] `npm run build` · [ ] `node --input-type=module -e "import('./src/js/format.js').then(m => console.log(m.formatPrice(120000), m.formatPrice(75000), m.formatPrice(45000)))"` imprime `$120.000 $75.000 $45.000`
- **Commit**: `feat(client-js): agrega store y formato de precios`

## T5: Componentes del encabezado y de la conexión
- **Archivos**: `client-js/src/js/components/EventHeader.js`, `client-js/src/js/components/ConnectionBanner.js` (crear); `client-js/src/css/main.css`, `client-js/src/index.html` (modificar)
- **Acciones**:
  - [ ] Crear `EventHeader(contenedor)` con `render(estado)`: marca, nombre, fecha, lugar y los tres precios con `formatPrice`; sin evento no pinta datos. Textos con `textContent`.
  - [ ] Crear `ConnectionBanner(contenedor)` con `render(estado)`: "Conectado" si `online`; franja roja con el mensaje del spec si `offline`.
  - [ ] Estilos `.event-header__*` y `.connection-banner--online` / `--offline` solo con variables de `:root`.
- **Verificación**: [ ] `npm run build` · [ ] `grep -nE '#[0-9A-Fa-f]{3,6}' client-js/src/css/main.css` solo coincide dentro de `:root`
- **Commit**: `feat(client-js): agrega encabezado del evento y estado de conexión`

## T6: Conexión de todo y aviso sin conexión
- **Archivos**: `client-js/src/js/app.js` (modificar)
- **Acciones**:
  - [ ] Armar los componentes, suscribirlos al store y repintar en cada cambio de estado.
  - [ ] Al cargar: `connect` y `getEventInfo` dentro de `try/catch`; con éxito el estado pasa a `online` con el evento; con error, a `offline`.
  - [ ] En `onDisconnect`, pasar a `offline` conservando `event` (RN-06).
- **Verificación**: [ ] `npm run build` · [ ] manual, las 6 filas de HU-04 y HU-05 de `plan.md` (desarrollo, entrega con `python3 -m http.server 8080 -d dist`, dos ventanas, sistema apagado, apagado con la página abierta, recarga) · [ ] `grep -rn "120000\|Manuelita" client-js/src` vacío
- **Commit**: `feat(client-js): muestra el evento y avisa la falta de conexión`

## T7: Cierre
- [ ] `npm run build` y `./gradlew build` en verde
- [ ] `README.md`: comandos de `client-js/`; `designs/ui.md`: texto de `ConnectionBanner` sin "REINTENTANDO"; `AGENTS.md`: `client-js/` deja de decir "por crear"
- [ ] `project_state.md`: frontend existe y quitar `tooling-webpack` de "Siguiente"; `epics.md`: marcar HU-04 y HU-05; `decisions.md` si surgió algo nuevo
- **Commit**: `docs(agents): cierra tooling-webpack`
- [ ] `git flow feature finish tooling-webpack` (solo si el usuario lo pide)
