# Convenciones del frontend (Vanilla JS + Webpack)

Base: apuntes Sesión 11 (estructura y separación de responsabilidades) y Sesión 12 (Webpack y Nginx). Prohibido React, Vue, Angular o similares.

## 1. Estructura (Sesión 11, adaptada)

```text
client-js/
  package.json          # scripts start / build / slice
  webpack.config.js
  src/
    index.html          # HTML semántico; plantilla de HtmlWebpackPlugin
    css/main.css        # variables CSS = tokens de .agents/designs/ui.md
    js/
      app.js            # punto de entrada: crea componentes, conecta eventos y datos
      api.js            # capa de servicios: ÚNICO archivo que habla con Ice
      store.js          # estado en memoria, separado del DOM
      components/       # un archivo por componente (PascalCase.js)
      generated/        # salida de slice2js: no se edita
```

## 2. Responsabilidades (flujo en una sola dirección)

```text
evento del usuario -> componente avisa por callback -> app.js llama api.js -> store.js cambia -> componentes se repintan
```

| Capa | Hace | No hace |
| :--- | :--- | :--- |
| `api.js` | crea el Communicator y el proxy (`BookingService:ws -h <host> -p 10002`, con `<host>` = `window.location.hostname` para que sirva en local y en la VM), expone funciones `async` (`getSeats()`, `lockSeat(id)`...), traduce excepciones Slice a `Error` con el `reason` en español | tocar el DOM |
| `store.js` | guarda sillas, carrito, `clientId`, conexión; `getState()`, `setState(cambios)`, `subscribe(fn)` | llamar a la red ni al DOM |
| `components/` | `export function SeatMap(contenedor, { onSeatClick })` que retorna `{ render(estado) }`; solo toca su propio contenedor | importar `api.js` o `store.js` |
| `app.js` | arma todo, maneja errores con `try/catch` y muestra avisos | lógica de presentación |

- Llamadas remotas siempre `async/await` (Sesión 9: invocación asíncrona para no congelar la interfaz; Sesión 11: patrón `try/catch`).
- Desestructurar datos: `const { id, zone, state } = seat`.
- Texto que viene del usuario o del servidor se inserta con `textContent`, nunca con `innerHTML`.
- `clientId` lo genera el navegador una vez por sesión (`sessionStorage`), formato `WEB-XXXXXX`.
- Estilos solo con las variables de `main.css`; ningún color literal fuera de `:root`.

## 3. Webpack (Sesión 12)

- Los 4 pilares: `mode`, `entry: './src/js/app.js'`, `output` (`dist/`, `bundle.[contenthash:8].js`, `clean: true`), `plugins` (`HtmlWebpackPlugin` con `template: './src/index.html'`).
- CSS con `style-loader` + `css-loader`. Dev server en puerto **3000**.
- Scripts: `"start": "webpack serve --mode development"`, `"build": "webpack --mode production"`, `"slice"` (genera `src/js/generated/` desde `../codigo_base/common/src/main/slice/BookingService.ice`).
- Solo `import`/`export` estáticos (condición del tree-shaking).
- Versión de `ice` en npm: 3.7.x, igual que el servidor.

## 4. Nombres

- Archivos de componente `PascalCase.js` (`SeatMap.js`); resto `camelCase.js`. Funciones y variables `camelCase`; constantes `UPPER_SNAKE_CASE`.
- Clases CSS en `kebab-case` con prefijo del componente: `.seat-map__seat`, `.seat-map__seat--mine`.
- Textos de interfaz en español.

## 5. Despliegue en la VM (bonificación, Sesión 12)

- Publicar **solo** `dist/` en `/var/www/<app>/` con Nginx (`try_files`, `gzip`). Nunca `src/` ni `node_modules/`.
- El navegador debe alcanzar el puerto WebSocket 10002 del servidor (o un `proxy_pass` de Nginx hacia él).
