# Especificación: Plano de sillas en vivo y retención

- **Slug**: mapa-sillas · **Rama**: `feature/mapa-sillas`
- **Fecha**: 2026-11-23
- **Estado**: Aprobado
- **RF/RNF**: RF-1 (aforo en vivo), RF-2, RF-7 (parcial: silla no disponible y sin conexión), RNF-1 (observable)
- **Requerimiento original**:
  > lo siguiente en implementar (siguiente de `project_state.md`: "`mapa-sillas`: aforo y retención (RF-1, RF-2, RF-7)")

## 1. Contexto y objetivo

Hoy el Comprador ve el evento y los precios, pero no las sillas. Objetivo: que vea las 90 sillas por zona con su estado al día (máximo 2 segundos de atraso), los contadores del aforo, y que pueda retener una silla disponible en exclusiva con un clic, con un mensaje claro si no se pudo. El temporizador, el carrito y el pago van en los specs siguientes.

## 2. Historias de usuario

### HU-06: Ver el plano de sillas y el aforo en vivo (Prioridad: P1) · RF-1

Como Comprador quiero ver el estado de las 90 sillas y los contadores del aforo, al día, para saber qué puedo comprar sin elegir sillas que ya están tomadas.

```gherkin
# language: es
Característica: Ver el plano de sillas y el aforo en vivo

  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Abrir la taquilla con todas las sillas disponibles
    Dado que las 90 sillas están disponibles
    Cuando el Comprador abre la taquilla
    Entonces ve la zona VIP con las filas A y B, Platea con C a E y General con F a I, 10 sillas por fila
    Y ve las 90 sillas como disponibles
    Y ve los contadores "Disponibles 90", "Retenidas 0" y "Vendidas 0"

  Escenario: Ver sillas en los cuatro estados
    Dado que el Comprador retuvo "A-1"
    Y que otro comprador retuvo "A-2"
    Y que "A-3" está vendida
    Cuando el Comprador mira el plano
    Entonces distingue "A-1" como suya, "A-2" como retenida por otro y "A-3" como vendida
    Y ve los contadores "Disponibles 87", "Retenidas 2" y "Vendidas 1"

  Escenario: Ver un cambio hecho por otro comprador
    Dado que el Comprador ve "C-4" como disponible
    Cuando otro comprador retiene "C-4"
    Entonces en máximo 2 segundos el Comprador ve "C-4" como retenida por otro
    Y el contador de disponibles baja en 1

  Escenario: La retención de otro comprador vence
    Dado que el Comprador ve "C-5" como retenida por otro
    Cuando pasan 90 segundos sin que ese comprador pague
    Entonces en máximo 2 segundos el Comprador ve "C-5" como disponible

  Escenario: Se pierde la conexión con el plano abierto
    Dado que el Comprador ve "A-3" como vendida y "B-1" como disponible
    Cuando la taquilla pierde la conexión
    Entonces en máximo 10 segundos ve el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
    Y sigue viendo el último estado del plano y de los contadores
```

### HU-07: Retener una silla desde el plano (Prioridad: P1) · RF-2, RF-7, RNF-1

Como Comprador quiero retener una silla disponible con un clic para que nadie más pueda tomarla mientras decido pagar.

```gherkin
# language: es
Característica: Retener una silla desde el plano

  Antecedentes:
    Dado que la taquilla está conectada

  Escenario: Retener una silla disponible
    Dado que "A-1" está disponible
    Cuando el Comprador elige "A-1"
    Entonces ve "A-1" como suya
    Y los demás compradores ven "A-1" como retenida por otro en máximo 2 segundos

  Escenario: Elegir una silla que ya tomó otro comprador
    Dado que el Comprador ve "B-3" como disponible
    Y que otro comprador acaba de retener "B-3"
    Cuando el Comprador elige "B-3"
    Entonces ve el mensaje "La silla B-3 ya no está disponible"
    Y ve "B-3" como retenida por otro
    Y sus sillas retenidas no cambian

  Escenario: Dos compradores eligen la misma silla al mismo tiempo
    Dado que "E-7" está disponible
    Cuando 2 compradores eligen "E-7" en el mismo instante
    Entonces exactamente 1 de ellos ve "E-7" como suya
    Y el otro ve el mensaje "La silla E-7 ya no está disponible"

  Escenario: Elegir una silla que ya es suya
    Dado que el Comprador retuvo "A-1" hace 30 segundos
    Cuando el Comprador elige "A-1"
    Entonces sigue viendo "A-1" como suya
    Y su retención sigue venciendo a los 90 segundos de haberla tomado

  Escenario: Elegir una silla sin conexión
    Dado que la taquilla perdió la conexión
    Cuando el Comprador elige "D-2"
    Entonces ve el mensaje "Sin conexión con la taquilla. Recarga la página para intentar de nuevo."
    Y "D-2" no queda como suya
    Y el plano conserva el último estado que veía
```

## 3. Reglas de negocio

- **RN-01**: El plano muestra 90 sillas en 3 zonas: VIP (A-B), Platea (C-E) y General (F-I), 10 por fila, código `<Fila>-<n>`.
- **RN-02**: Cada silla se ve en uno de 4 estados distinguibles: disponible, mía, retenida por otro, vendida.
- **RN-03**: Los contadores cumplen Disponibles + Retenidas + Vendidas = 90; "Retenidas" incluye las del Comprador y las de otros.
- **RN-04**: Un cambio hecho por cualquier comprador se ve en todos los planos abiertos en máximo 2 segundos.
- **RN-05**: Solo una silla disponible se puede retener; elegir una retenida por otro o vendida muestra "La silla <código> ya no está disponible".
- **RN-06**: Elegir una silla propia no cambia nada: no la libera ni reinicia su tiempo.
- **RN-07**: No hay máximo de sillas retenidas por Comprador.
- **RN-08**: Un error al retener no borra lo que el Comprador ya veía ni sus otras sillas retenidas.

## 4. Fuera de alcance

- Cuenta regresiva visible, carrito, quitar sillas y aviso de retención vencida al Comprador (`carrito-temporizador`).
- Pago, comprobante y mis compras (`checkout-reservas`).
- Reintento automático de la conexión.
- Filtrar el plano por zona.
- Qué sillas ve como suyas el Comprador tras recargar la página (`carrito-temporizador`).

## 5. Supuestos y preguntas abiertas

- **Supuesto**: el plano no deja elegir sillas vendidas ni retenidas por otro que ya se ven así; el mensaje de RN-05 cubre el caso en que el plano aún no se había actualizado.
- **Supuesto**: el aspecto (colores, escenario, leyenda de estados) sigue `designs/ui.md` y el wireframe `docs/mockup_componentes.png`.

## 6. Notas para el diseño (no vinculantes)

- Respuestas del usuario: actualización máxima de 2 s; clic en silla propia no hace nada (quitarla es del carrito); sin límite de sillas.
- Riesgo D-010 (`project_state.md`): llamadas atendidas de a una y 25 ms por retención; revisar si la actualización cada 2 s lo hace notar.
- Enunciado: vincular los clics del plano con `lockSeat`; contadores desde `getEventInfo()`; estado de sillas desde `getAllSeats()`.
