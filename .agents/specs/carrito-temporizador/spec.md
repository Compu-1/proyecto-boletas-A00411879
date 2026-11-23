# Especificación: Carrito y temporizador de retención

- **Slug**: carrito-temporizador · **Rama**: `feature/carrito-temporizador`
- **Fecha**: 2026-11-23
- **Estado**: Aprobado
- **RF/RNF**: RF-3, RF-4, RF-7 (parcial: sin conexión al quitar)
- **Requerimiento original**:
  > Realiza el spec del carrito y temporizador (siguiente de `project_state.md`: "`carrito-temporizador`: cuenta regresiva y liberación (RF-3, RF-4)")

## 1. Contexto y objetivo

Hoy el Comprador retiene sillas desde el plano, pero no ve cuánto tiempo le queda ni puede soltarlas. Objetivo: un carrito con sus sillas retenidas, el precio, el total y la cuenta regresiva de cada una; que las vencidas salgan solas y que pueda quitar las que no quiera, liberándolas para los demás. El pago va en `checkout-reservas`.

## 2. Historias de usuario

### HU-08: Ver mis sillas retenidas con su cuenta regresiva (Prioridad: P1) · RF-3, RF-4

Como Comprador quiero ver en un carrito mis sillas retenidas con su precio, el total y el tiempo que le queda a cada una para saber cuánto pagaré y cuánto tiempo tengo para decidir.

```gherkin
# language: es
Característica: Ver mis sillas retenidas con su cuenta regresiva

  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Retener la primera silla
    Dado que el carrito del Comprador está vacío
    Cuando el Comprador retiene "A-1"
    Entonces ve en su carrito "A-1 · VIP · $120.000" con "01:30" restantes
    Y ve el total "$120.000"

  Escenario: Varias sillas con tiempos distintos
    Dado que el Comprador retuvo "A-1" hace 40 segundos
    Cuando el Comprador retiene "F-3"
    Entonces ve "A-1" con "00:50" y "F-3" con "01:30"
    Y ve el total "$165.000"

  Escenario: Carrito vacío
    Dado que el Comprador no tiene sillas retenidas
    Cuando el Comprador abre la taquilla
    Entonces ve el mensaje "Tu carrito está vacío"
    Y no ve ninguna cuenta regresiva ni total

  Escenario: Recargar la página con sillas retenidas
    Dado que el Comprador retuvo "B-4" hace 20 segundos
    Cuando el Comprador recarga la página
    Entonces ve en su carrito "B-4" con "01:10" restantes
```

### HU-09: Liberar sola una silla cuando vence su tiempo (Prioridad: P1) · RF-3

Como Comprador quiero que una silla que no pagué a tiempo salga sola de mi carrito para que el carrito muestre solo lo que todavía puedo pagar.

```gherkin
# language: es
Característica: Liberar sola una silla cuando vence su tiempo

  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: La retención llega a cero
    Dado que el Comprador tiene solo "D-5" en su carrito con "00:01" restantes
    Cuando pasa 1 segundo
    Entonces "D-5" sale de su carrito sin ningún mensaje
    Y ve el mensaje "Tu carrito está vacío"
    Y ve "D-5" como disponible en el plano

  Escenario: Vence una de dos sillas
    Dado que el Comprador tiene "A-1" con "00:01" y "F-3" con "00:45"
    Cuando pasa 1 segundo
    Entonces su carrito muestra solo "F-3" con "00:44"
    Y ve el total "$45.000"

  Escenario: Otro comprador puede tomar la silla vencida
    Dado que la retención del Comprador sobre "D-5" acaba de vencer
    Cuando otro comprador elige "D-5"
    Entonces el otro comprador ve "D-5" como suya

  Escenario: Vence sin conexión
    Dado que el Comprador tiene "E-2" con "00:05" restantes
    Y que la taquilla perdió la conexión
    Cuando pasan 5 segundos
    Entonces "E-2" sale de su carrito
    Y sigue viendo el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
```

### HU-10: Quitar una silla de mi carrito (Prioridad: P1) · RF-4, RF-7

Como Comprador quiero quitar una silla de mi carrito antes de que venza para liberarla de inmediato y que otro pueda comprarla.

```gherkin
# language: es
Característica: Quitar una silla de mi carrito

  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Quitar una silla
    Dado que el Comprador tiene "A-1" y "C-2" en su carrito
    Cuando el Comprador quita "A-1"
    Entonces su carrito muestra solo "C-2" con el mismo tiempo restante que tenía
    Y ve el total "$75.000"
    Y ve "A-1" como disponible en el plano

  Escenario: Los demás ven la silla liberada
    Dado que otro comprador ve "A-1" como retenida por otro
    Cuando el Comprador quita "A-1" de su carrito
    Entonces en máximo 2 segundos el otro comprador ve "A-1" como disponible

  Escenario: Volver a elegir una silla quitada
    Dado que el Comprador quitó "A-1" de su carrito
    Cuando el Comprador elige "A-1" en el plano
    Entonces ve "A-1" en su carrito con "01:30" restantes

  Escenario: Quitar una silla sin conexión
    Dado que el Comprador tiene "B-7" en su carrito
    Y que la taquilla perdió la conexión
    Cuando el Comprador quita "B-7"
    Entonces "B-7" sale de su carrito
    Y sigue viendo el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
```

## 3. Reglas de negocio

- **RN-01**: Cada línea del carrito muestra silla, zona, precio y tiempo restante en formato `mm:ss`, que baja 1 vez por segundo.
- **RN-02**: El tiempo restante de cada silla parte de 90 s desde que se retuvo y difiere del vencimiento real en máximo 2 s.
- **RN-03**: El total es la suma de los precios de las sillas del carrito (VIP $120.000, Platea $75.000, General $45.000).
- **RN-04**: Al llegar a `00:00` la silla sale del carrito sin mensaje y queda disponible para todos.
- **RN-05**: Quitar una silla la libera de inmediato para todos; las demás sillas del carrito conservan su tiempo.
- **RN-06**: Si quitar una silla no se puede confirmar (sin conexión o ya vencida), igual sale del carrito; si seguía retenida, vence sola a los 90 s.
- **RN-07**: Tras recargar la página, el carrito muestra las sillas del Comprador que no han vencido, con el tiempo que les queda.

## 4. Fuera de alcance

- Pagar, comprobante y mis compras (`checkout-reservas`).
- Extender o renovar el tiempo de una retención.
- Vaciar todo el carrito en un solo paso.
- Aviso de urgencia en los últimos segundos (la mecha de `designs/ui.md` se descarta).
- Recuperar el carrito en otra pestaña o navegador.

## 5. Supuestos y preguntas abiertas

- **Supuesto**: las sillas del carrito aparecen en el orden en que se retuvieron.

## 6. Notas para el diseño (no vinculantes)

- Respuestas del usuario: al recargar se recuperan las sillas (el `clientId` ya persiste por pestaña, D-025); al vencer la silla sale del carrito sin mensaje; si quitar falla, se quita igual.
- Enunciado: quitar vinculado con `releaseSeat`; `getMyLockedSeats(clientId)` retorna las sillas retenidas con temporizador activo.
- `designs/ui.md`: carrito como talón (`silla · zona · precio · mm:ss · ×`, total); el usuario descartó la mecha.
