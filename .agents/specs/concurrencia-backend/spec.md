# Especificación: Sillas exclusivas y sin sobreventa con compradores simultáneos

- **Slug**: concurrencia-backend · **Rama**: `feature/concurrencia-backend`
- **Fecha**: 2026-11-22
- **Estado**: Aprobado
- **RF/RNF**: RF-2, RF-3, RF-5, RNF-1
- **Requerimiento original**: "especifica la concurrencia en el backend"

## 1. Contexto y objetivo

Hoy, cuando varios compradores eligen la misma silla en el mismo instante, todos creen haberla obtenido (10 de 10 en la prueba de estrés); además, una silla puede pagarse sin haberla retenido y las retenciones vencidas se siguen mostrando como retenidas. Objetivo: cada silla tiene un solo dueño a la vez, nunca se vende dos veces y todos los compradores ven un aforo coherente. Rol: Comprador.

## 2. Historias de usuario

### HU-01: Retener una silla en exclusiva (Prioridad: P1) · RF-2, RNF-1

Como Comprador quiero que la silla que retengo sea solo mía para pagarla sin que otra persona me la quite.

```gherkin
# language: es
Característica: Retener una silla en exclusiva

  Antecedentes:
    Dado que el inventario tiene las 90 sillas disponibles

  Escenario: Retener una silla disponible
    Cuando el comprador "Ana" elige la silla "A-1"
    Entonces "A-1" queda retenida a nombre de "Ana" por 90 segundos
    Y cualquier otro comprador ve "A-1" como retenida

  Esquema del escenario: Varios compradores eligen la misma silla en el mismo instante
    Cuando <compradores> compradores distintos eligen la silla "A-1" en el mismo instante
    Entonces exactamente 1 comprador obtiene "A-1"
    Y los otros <rechazados> ven el mensaje "La silla A-1 ya no se encuentra disponible"
    Ejemplos:
      | compradores | rechazados |
      | 2           | 1          |
      | 10          | 9          |
      | 50          | 49         |

  Escenario: Compradores eligen sillas distintas en el mismo instante
    Cuando 10 compradores eligen cada uno una silla distinta de la fila "C" en el mismo instante
    Entonces los 10 compradores obtienen su silla
    Y el aforo muestra 80 disponibles, 10 retenidas y 0 vendidas

  Escenario: Renovar la retención de una silla propia
    Dado que "Ana" retuvo "A-1" hace 60 segundos
    Cuando "Ana" vuelve a elegir "A-1"
    Entonces "A-1" sigue a nombre de "Ana" con 90 segundos restantes
```

### HU-02: Pagar sin sobreventa (Prioridad: P1) · RF-5, RNF-1

Como Comprador quiero que mi pago solo incluya las sillas que retuve y siguen vigentes para no pagar algo que otra persona también compró.

```gherkin
# language: es
Característica: Pagar sin sobreventa

  Antecedentes:
    Dado que "Ana" tiene retenidas "A-1" y "A-2" con 60 segundos restantes

  Escenario: Pagar sillas retenidas y vigentes
    Cuando "Ana" paga las sillas "A-1" y "A-2"
    Entonces "A-1" y "A-2" quedan vendidas
    Y "Ana" recibe un código de reserva "RES-" seguido de 8 caracteres
    Y el total cobrado es $240.000

  Escenario: Pagar dos veces en el mismo instante
    Cuando "Ana" envía dos veces el pago de "A-1" y "A-2" en el mismo instante
    Entonces se genera exactamente 1 código de reserva
    Y el otro intento ve el mensaje "La silla A-1 ya fue vendida definitivamente"

  Escenario: Otro comprador intenta pagar la misma silla en el mismo instante
    Cuando "Ana" y "Beto" pagan la silla "A-1" en el mismo instante
    Entonces solo "Ana" recibe código de reserva
    Y "Beto" no recibe código ni cobro
    Y "A-1" aparece vendida una sola vez, a nombre de "Ana"

  Esquema del escenario: El pago se rechaza completo si una silla no es válida
    Dado que la silla "C-5" está <estado>
    Cuando "Ana" paga las sillas "A-1" y "C-5"
    Entonces ve el mensaje "<mensaje>"
    Y ni "A-1" ni "C-5" quedan vendidas a nombre de "Ana"
    Y "A-1" sigue retenida a nombre de "Ana"
    Ejemplos:
      | estado                       | mensaje                                                |
      | disponible sin retener       | La silla C-5 no está retenida a tu nombre              |
      | retenida por Beto            | La silla C-5 se encuentra bloqueada por otro comprador |
      | vendida                      | La silla C-5 ya fue vendida definitivamente            |
      | retenida por Ana pero vencida | El bloqueo temporal de la silla C-5 ha expirado       |
```

### HU-03: Liberar automáticamente las retenciones vencidas (Prioridad: P1) · RF-3

Como Comprador quiero ver disponibles las sillas cuya retención venció para poder elegirlas sin esperar a nadie.

```gherkin
# language: es
Característica: Liberar automáticamente las retenciones vencidas

  Antecedentes:
    Dado que "Ana" retuvo "A-1" y no la pagó

  Esquema del escenario: Estado de la silla según el tiempo transcurrido
    Dado que pasaron <segundos> segundos desde la retención
    Cuando "Beto" consulta el aforo
    Entonces ve "A-1" <estado> y contada entre las <estado_aforo>
    Ejemplos:
      | segundos | estado     | estado_aforo |
      | 89       | retenida   | retenidas    |
      | 90       | disponible | disponibles  |

  Escenario: Otro comprador retiene la silla vencida
    Dado que pasaron 90 segundos desde la retención
    Cuando "Beto" elige "A-1"
    Entonces "A-1" queda retenida a nombre de "Beto" por 90 segundos

  Escenario: El comprador original pierde la silla vencida
    Dado que pasaron 90 segundos desde la retención
    Cuando "Ana" consulta sus sillas retenidas
    Entonces "A-1" ya no aparece entre ellas
```

## 3. Reglas de negocio

- **RN-01**: Una silla tiene como máximo un comprador con retención vigente en cada momento.
- **RN-02**: Una retención dura 90 segundos desde que se obtiene; si el mismo comprador vuelve a elegir su silla, se renueva a 90 segundos.
- **RN-03**: Solo se pagan sillas retenidas por el mismo comprador y con retención vigente.
- **RN-04**: El pago es todo o nada: si una silla incumple RN-03, no se vende ninguna y las retenciones válidas se conservan.
- **RN-05**: Una silla se vende una sola vez y queda asociada a un único código de reserva.
- **RN-06**: A partir del segundo 90, una retención vencida se muestra como disponible en toda consulta, aunque nadie haya intentado elegir esa silla.
- **RN-07**: En toda consulta, disponibles + retenidas + vendidas = 90, y cada silla aparece en un solo estado.

## 4. Fuera de alcance

- Interfaz web y validación de nombre y correo (specs `mapa-sillas`, `carrito-temporizador`, `checkout-reservas`).
- Límite de sillas por comprador, conservar ventas tras reiniciar el sistema y avisos de vencimiento.
- Reinicio del inventario: herramienta de laboratorio, no acción del Comprador.

## 5. Supuestos y preguntas abiertas

- **Supuesto**: "en el mismo instante" = solicitudes disparadas a la vez, como en la prueba de estrés existente.
- **Supuesto**: se conservan los textos de error actuales (pueden agregar detalle al final); el único nuevo es "La silla C-5 no está retenida a tu nombre".
- **Supuesto**: RN-04 sigue al enunciado, que describe la compra como "confirmación transaccional".

## 6. Notas para el diseño (no vinculantes)

- Requerimiento textual: "especifica la concurrencia en el backend".
- Cubre los defectos 1 a 5 de `.agents/memory/project_state.md`.
