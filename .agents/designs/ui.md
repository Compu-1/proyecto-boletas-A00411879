# Diseño de interfaz: "Sala a oscuras"

Referencia visual: [`mockup.html`](mockup.html) (abrir en el navegador). Es estático y orientativo; los tokens de abajo son los que usa `client-js/src/css/main.css`.

## Idea

La página es el auditorio con las luces apagadas. Las sillas son puntos de luz blancos sobre negro y **lo único rojo en pantalla es lo del comprador**: sus sillas, su tiempo y su botón de pago. Si algo es rojo, es tuyo o es urgente.

Tres gestos poco comunes, todos simples de construir:

1. **Mecha**: una línea roja de 4 px pegada al borde superior de la ventana que se consume con el tiempo de la retención más próxima a vencer. Parpadea los últimos 10 s. No existe si el carrito está vacío.
2. **Talón de boleta**: el carrito es un boleto con línea de corte perforada y números monoespaciados.
3. **Boleto impreso**: el pago y el comprobante se abren invertidos (panel blanco, texto negro), como un boleto recién impreso; el código `RES-XXXXXXXX` va enorme.

## Tokens

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--negro` | `#0A0A0A` | fondo |
| `--negro-2` | `#161616` | superficie del talón |
| `--linea` | `#3A3A3A` | bordes, sillas vendidas |
| `--gris` | `#9A9A9A` | texto secundario, sillas retenidas por otro |
| `--blanco` | `#FAFAFA` | texto, sillas disponibles, paneles invertidos |
| `--rojo` | `#E10600` | lo del comprador y errores |
| `--gris-oscuro` | `#555555` | texto secundario sobre paneles blancos |
| `--fuente-texto` | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | texto |
| `--fuente-mono` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` | códigos de silla, precios, tiempos, contadores |
| `--e1`...`--e5` | `4 / 8 / 16 / 24 / 40 px` | espaciado |
| `--silla` | `28px` (22 px en móvil) | diámetro de una silla |

Reglas: grises solo derivados de negro y blanco; esquinas rectas en todo (radio 0) salvo las sillas, que son círculos; sin fuentes externas.

**Contraste**: el rojo nunca es texto pequeño sobre negro (3,98:1). Sí puede ser relleno, línea, botón con texto blanco (4,76:1) o texto de error sobre blanco (4,76:1).

## Estados de silla (forma y color, nunca solo color)

| Estado | Aspecto | Clic |
| :--- | :--- | :--- |
| Disponible | círculo con borde blanco; al pasar el mouse se llena de blanco | retener |
| Tuya | relleno rojo | quitar del carrito |
| Retenida por otro | borde gris **punteado** | no |
| Vendida | relleno `--linea`, sin borde | no |

## Composición

```text
████████████████████████████░░░░░░░░░░░░░░░  <- mecha roja (tiempo de la más próxima a vencer)
ICESI LIVE ARENA                                      73        6        11
CONCIERTO ICESI LIVE ROCK & POP 2026               LIBRES  RETENIDAS  VENDIDAS
2026-11-28 20:00 · Auditorio Manuelita
──────────────────────────────────────────────────────────────────────────────
            ────────── E S C E N A R I O ──────────        ┌ TU BOLETA ─────────┐
  VIP · $120.000                                           │ A-4 VIP $120.000 00:54 × │
  A  ○ ○ ○ ● ●   ○ ○ ○ ○ ○                                 │ A-5 VIP $120.000 01:12 × │
  B  ○ ○ ◌ ◌ ○   ○ ○ ○ ○ ○                                 ( - - - - - - - - - - - )
  PLATEA · $75.000                                         │ TOTAL       $240.000 │
  C  ▪ ▪ ▪ ○ ○   ○ ○ ○ ○ ○                                 │ [      PAGAR       ] │
  ...                                                      └────────────────────┘
  ○ disponible  ● tuya  ◌ retenida por otro  ▪ vendida
```

- Pantallas de 900 px o más: mapa a la izquierda, talón fijo de 320 px a la derecha. Menos de 900 px: talón debajo del mapa.
- Pasillo entre la silla 5 y la 6 de cada fila. Letra de fila en gris monoespaciado a la izquierda; nombre y precio de zona encima de cada bloque.
- "Escenario": línea blanca con un leve resplandor, arriba del mapa.

## Componentes

| Componente | Contenido |
| :--- | :--- |
| `EventHeader` | marca, nombre del evento, fecha y lugar, tres contadores grandes en mono |
| `FuseBar` (mecha) | barra roja superior; ancho = segundos restantes / 90 |
| `SeatMap` | escenario, zonas, filas y sillas con los 4 estados, leyenda |
| `Cart` (talón) | líneas `silla · zona · precio · mm:ss · ×`, corte perforado, total, botón Pagar |
| `CheckoutModal` | panel blanco: resumen, nombre, correo, errores en rojo, Confirmar |
| `Receipt` | panel blanco: código grande, sillas, total, "Guarda este código"; también lista "Mis compras" |
| `Toast` | aviso abajo a la izquierda: fondo negro, texto blanco, barra izquierda roja (error) o blanca (info); se oculta a los 4 s |
| `ConnectionBanner` | franja roja "SIN CONEXIÓN CON LA TAQUILLA · REINTENTANDO"; el mapa baja a 40 % de opacidad y no acepta clics |

## Movimiento

Transiciones de 150 ms, sin rebotes. Con `prefers-reduced-motion`, la mecha no parpadea.

## Enfoques considerados

| Enfoque | A favor | En contra |
| :--- | :--- | :--- |
| **Sala a oscuras** (elegido) | el mapa es protagonista; el rojo cuenta una sola historia ("lo tuyo"); fácil de explicar | ninguno relevante |
| Póster suizo (fondo blanco, tipografía gigante, rojo de acento) | muy editorial | el título compite con el mapa |
| Recibo brutalista (todo mono, bordes gruesos) | muy original | cansa y el mapa se lee peor |
