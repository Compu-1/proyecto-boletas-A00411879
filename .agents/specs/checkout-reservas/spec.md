# Especificación: Pago, comprobante y mis compras

- **Slug**: checkout-reservas · **Rama**: `feature/checkout-reservas`
- **Fecha**: 2026-11-23
- **Estado**: Aprobado
- **RF/RNF**: RF-5, RF-6, RF-7 (parcial: errores de pago y sin conexión), RNF-1 (sin sillas repetidas)
- **Requerimiento original**:
  > usa /c-specify para hacer el checkout-reservas

## 1. Contexto y objetivo

El Comprador ya retiene sillas y las ve en su carrito, pero no puede pagarlas. Objetivo: pagar todo el carrito con nombre y correo válido, recibir un comprobante con su código de reserva y poder consultar después sus compras. Se cierra también el defecto de pedidos con una silla repetida.

## 2. Historias de usuario

### HU-11: Pagar mis sillas con nombre y correo (Prioridad: P1) · RF-5, RF-7

Como Comprador quiero pagar las sillas de mi carrito con mi nombre y correo para quedarme con ellas de forma definitiva.

```gherkin
# language: es
Característica: Pagar mis sillas con nombre y correo
  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Pagar con datos válidos
    Dado que el Comprador tiene "A-1" y "F-3" en su carrito, con total "$165.000"
    Cuando el Comprador paga con el nombre "Ana Pérez" y el correo "ana@correo.com"
    Entonces su carrito queda vacío
    Y ve su comprobante de compra

  Esquema del escenario: Datos de contacto inválidos
    Dado que el Comprador tiene "A-1" en su carrito
    Cuando el Comprador paga con el nombre "<nombre>" y el correo "<correo>"
    Entonces ve el mensaje "<mensaje>"
    Y "A-1" sigue en su carrito con el mismo tiempo restante

    Ejemplos:
      | nombre    | correo         | mensaje                  |
      |           | ana@correo.com | Escribe tu nombre        |
      | Ana Pérez | ana.correo.com | Escribe un correo válido |

  Escenario: Pagar con el carrito vacío
    Dado que el Comprador no tiene sillas en su carrito
    Cuando el Comprador intenta pagar
    Entonces ve el mensaje "Elige al menos una silla para pagar"
    Y no se genera ningún comprobante

  Escenario: Una retención vence antes de pagar
    Dado que el Comprador tiene "A-1" con "00:01" y "F-3" con "00:45" en su carrito
    Y que pasan 2 segundos
    Cuando el Comprador paga con datos válidos
    Entonces ve el mensaje "El bloqueo temporal de la silla A-1 ha expirado"
    Y ninguna de las dos sillas queda vendida
    Y su carrito muestra solo "F-3" con "00:43"

  Escenario: Pagar sin conexión
    Dado que el Comprador tiene "B-7" en su carrito
    Y que la taquilla perdió la conexión
    Cuando el Comprador paga con datos válidos
    Entonces ve el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
    Y "B-7" sigue en su carrito sin ser pagada
```

### HU-12: Recibir mi comprobante con el código de reserva (Prioridad: P1) · RF-5, RNF-1

Como Comprador quiero un comprobante con un código de reserva único para demostrar que mis sillas son mías y que nadie más las compra.

```gherkin
# language: es
Característica: Recibir mi comprobante con el código de reserva
  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Ver el comprobante
    Dado que el Comprador pagó "A-1" y "F-3" como "Ana Pérez" con el correo "ana@correo.com"
    Entonces ve un código con el formato "RES-" seguido de 8 caracteres, por ejemplo "RES-7K2M9QXA"
    Y ve las sillas "A-1" y "F-3" con su zona y precio, el total "$165.000", el nombre "Ana Pérez" y el correo "ana@correo.com"

  Escenario: Las sillas pagadas quedan vendidas para todos
    Dado que el Comprador pagó "A-1" y otro comprador ve "A-1" como retenida por otro
    Entonces en máximo 2 segundos el otro comprador ve "A-1" como vendida y no puede elegirla

  Escenario: Cada pago tiene su propio código
    Dado que el Comprador pagó "A-1" con el código "RES-7K2M9QXA"
    Cuando el Comprador retiene "C-2" y la paga
    Entonces ve un código distinto de "RES-7K2M9QXA"

  Escenario: Pedido con una silla repetida
    Dado que el Comprador tiene "A-1" retenida
    Cuando el Comprador paga un pedido que incluye "A-1" dos veces
    Entonces ve el mensaje "La silla A-1 está repetida en el pedido"
    Y "A-1" no queda vendida
    Y "A-1" sigue retenida a su nombre
```

### HU-13: Consultar mis compras (Prioridad: P2) · RF-6

Como Comprador quiero ver mis compras confirmadas para recuperar mis códigos de reserva cuando los necesite.

```gherkin
# language: es
Característica: Consultar mis compras
  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Ver compras confirmadas
    Dado que el Comprador pagó "A-1" y "F-3" con el código "RES-7K2M9QXA" y "C-2" con el código "RES-4T8B1ZNE"
    Cuando el Comprador abre sus compras
    Entonces ve 2 compras, cada una con su código, sus sillas y su total
    Y ve "RES-7K2M9QXA" con total "$165.000" y "RES-4T8B1ZNE" con total "$75.000"

  Escenario: Sin compras todavía
    Dado que el Comprador no ha pagado ninguna silla
    Cuando el Comprador abre sus compras
    Entonces ve el mensaje "Aún no tienes compras"

  Escenario: Recargar la página con compras
    Dado que el Comprador pagó "A-1" con el código "RES-7K2M9QXA"
    Cuando el Comprador recarga la página y abre sus compras
    Entonces ve la compra "RES-7K2M9QXA"
```

## 3. Reglas de negocio

- **RN-01**: Se paga todo el carrito en un solo pago; el total es la suma de los precios (VIP $120.000, Platea $75.000, General $45.000). No hay pago de una parte del carrito.
- **RN-02**: El nombre no puede estar vacío ni ser solo espacios; el correo tiene la forma `texto@dominio.ext`, sin espacios.
- **RN-03**: Solo se pagan sillas con retención vigente del mismo Comprador; si una no cumple, no se vende ninguna y las retenciones vigentes se conservan (todo o nada).
- **RN-04**: Un pedido con una silla repetida se rechaza completo: no se vende ni se cobra ninguna silla.
- **RN-05**: Un pago exitoso genera un código `RES-` + 8 caracteres, único por pago y compartido por todas las sillas de ese pago.
- **RN-06**: Una silla vendida no vuelve a estar disponible ni se puede retener; los demás compradores la ven vendida en máximo 2 s.
- **RN-07**: Mis compras muestra solo los pagos hechos desde la misma sesión, con código, sillas, total, nombre y correo, y se conserva al recargar.

## 4. Fuera de alcance

- Pago real o pasarela: el pago es una confirmación simulada.
- Enviar, imprimir o descargar el comprobante.
- Cancelar o reembolsar una compra; pagar solo parte del carrito.
- Ver las compras desde otro navegador o pestaña (no hay cuenta).

## 5. Supuestos y preguntas abiertas

- **Supuesto**: el mensaje "La silla A-1 está repetida en el pedido" es nuevo; "El bloqueo temporal de la silla A-1 ha expirado" ya existe (spec `concurrencia-backend`) y se conserva.
- **Supuesto**: las compras se listan de la más reciente a la más antigua y se puede pagar varias veces en la misma sesión.

## 6. Notas para el diseño (no vinculantes)

- Enunciado: `confirmBooking(seatIds, clientId, name, email)` y `getMyBookings(clientId)`; código `RES-XXXXXX` (el servidor ya genera 8 caracteres).
- Servidor actual: el correo solo exige `@`; RN-02 pide endurecerlo. `project_state.md` defecto 1: `confirmBooking` no rechaza ids repetidos (`["A-1","A-1"]` cobra la silla dos veces); verificable con el cliente Java.
- `designs/ui.md`: pago y comprobante como boleto impreso (panel blanco, texto negro, código enorme); `CheckoutModal` y `Receipt`, que también lista "Mis compras".
