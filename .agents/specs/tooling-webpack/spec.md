# Especificación: Abrir la taquilla en el navegador y ver el evento

- **Slug**: tooling-webpack · **Rama**: `feature/tooling-webpack`
- **Fecha**: 2026-11-22
- **Estado**: Aprobado
- **RF/RNF**: RF-1 (parcial: evento y precios), RF-7 (parcial: sin conexión), RNF-3, RNF-4
- **Requerimiento original**:
  > tooling-webpack: proyecto client-js/ con Webpack y conexión Ice (Fase 1 del enunciado, RNF-3, RNF-4)

## 1. Contexto y objetivo

Hoy el Comprador no tiene cómo entrar a la taquilla desde el navegador. Objetivo: que pueda abrirla, vea los datos del concierto y los precios por zona tal como los tiene el sistema, y sepa con un mensaje claro cuando no hay conexión. Es la base sobre la que se montan el plano de sillas, el carrito y el pago. Rol: Comprador.

## 2. Historias de usuario

### HU-04: Abrir la taquilla y ver el evento (Prioridad: P1) · RF-1, RNF-3, RNF-4

Como Comprador quiero abrir la taquilla en mi navegador y ver el concierto con sus precios para decidir en qué zona comprar.

```gherkin
# language: es
Característica: Abrir la taquilla y ver el evento

  Antecedentes:
    Dado que el sistema de la taquilla está encendido

  Esquema del escenario: Abrir la taquilla en sus dos versiones
    Cuando el Comprador abre la taquilla en su versión de <versión>
    Entonces ve el evento "Concierto Icesi Live Rock & Pop 2026"
    Y ve la fecha "2026-11-28 20:00" y el lugar "Auditorio Manuelita - Universidad Icesi"
    Y ve los precios VIP $120.000, Platea $75.000 y General $45.000
    Y ve el estado "Conectado"
    Ejemplos:
      | versión    |
      | desarrollo |
      | entrega    |

  Escenario: Dos compradores abren la taquilla al mismo tiempo
    Cuando 2 compradores abren la taquilla en ventanas distintas en el mismo instante
    Entonces los 2 ven el mismo evento, los mismos precios y el estado "Conectado"
```

### HU-05: Saber que no hay conexión con la taquilla (Prioridad: P1) · RF-7, RNF-4

Como Comprador quiero que la taquilla me avise cuando no puede conectarse para no esperar datos que no van a llegar.

```gherkin
# language: es
Característica: Saber que no hay conexión con la taquilla

  Escenario: Abrir la taquilla con el sistema apagado
    Dado que el sistema de la taquilla está apagado
    Cuando el Comprador abre la taquilla
    Entonces en máximo 10 segundos ve el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
    Y no ve precios ni datos del evento

  Escenario: El sistema se apaga con la taquilla abierta
    Dado que el Comprador ve el evento y el estado "Conectado"
    Cuando el sistema de la taquilla se apaga
    Entonces en máximo 10 segundos ve el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
    Y sigue viendo el evento y los precios que ya tenía
    Y deja de ver el estado "Conectado"

  Escenario: Recargar cuando el sistema volvió
    Dado que el Comprador ve el mensaje de sin conexión
    Y que el sistema de la taquilla se volvió a encender
    Cuando el Comprador recarga la página
    Entonces ve el evento, los precios y el estado "Conectado"
    Y ya no ve el mensaje de sin conexión
```

## 3. Reglas de negocio

- **RN-01**: Los datos del evento y los precios se muestran tal como los tiene el sistema en ese momento; la taquilla no muestra valores escritos de antemano.
- **RN-02**: Los precios se muestran en pesos con punto de miles y sin decimales: `$120.000`.
- **RN-03**: La versión de desarrollo y la de entrega muestran exactamente lo mismo.
- **RN-04**: El aviso de sin conexión aparece en máximo 10 segundos, tanto al abrir como si la conexión se pierde después.
- **RN-05**: Sin conexión la taquilla no reintenta sola; el Comprador recarga la página.
- **RN-06**: Perder la conexión no borra lo que el Comprador ya veía.

## 4. Fuera de alcance

- Plano de sillas, contadores de aforo y su actualización en vivo (`mapa-sillas`).
- Retener, quitar y pagar sillas; comprobante y mis compras (`carrito-temporizador`, `checkout-reservas`).
- Reintento automático de la conexión.
- Despliegue en la máquina de la sala (`despliegue-vm`).

## 5. Supuestos y preguntas abiertas

- **Supuesto**: 10 segundos es el tiempo máximo aceptable para avisar la falta de conexión.
- **Supuesto**: "versión de entrega" es la que se genera para entregar, abierta como sitio estático con el sistema encendido.
- **Supuesto**: el aspecto visual sigue `designs/ui.md` ("Sala a oscuras"); el spec no fija la distribución en pantalla.

## 6. Notas para el diseño (no vinculantes)

- Requerimiento textual: "proyecto client-js/ con Webpack y conexión Ice (Fase 1 del enunciado, RNF-3, RNF-4)".
- Enunciado, Fase 1: `npm init -y` en `client-js/`; `html-webpack-plugin`, `style-loader`, `css-loader`, `ice`; `webpack.config.js` con ES Modules, bundle único, inyección de HTML y dev server en el puerto 3000.
- Enunciado: `npm start` (desarrollo, puerto 3000) y `npm run build` (producción en `dist/`).
- Enunciado: el navegador habla con el backend solo por WebSocket `ws://localhost:10002` con la librería oficial `ice`; TCP 10000 queda para pruebas.
- Decisiones previas: D-001 (JavaScript, no TypeScript) y D-002 (capas `api` / `store` / `components` / `app`; solo `api.js` conoce Ice).
