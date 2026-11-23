# Plantilla de especificación (c-specify)

Copiar a `.agents/specs/<slug>/spec.md` y reemplazar lo que está entre `<...>`. El ejemplo final muestra el nivel de detalle; no se copia.

---

````markdown
# Especificación: <Nombre de la funcionalidad>

- **Slug**: <slug> · **Rama**: `feature/<slug>`
- **Fecha**: <AAAA-MM-DD>
- **Estado**: Borrador
- **RF/RNF**: <RF-n, RNF-n>
- **Requerimiento original**:
  > <cita textual del usuario>

## 1. Contexto y objetivo

<Problema y valor esperado, en 1 a 3 frases.>

## 2. Historias de usuario

### HU-<NN>: <Título corto> (Prioridad: P1)

Como Comprador quiero <capacidad> para <beneficio>.

**Criterios de aceptación**

```gherkin
# language: es
Característica: <Título de la historia>

  Antecedentes:
    Dado <estado previo común>

  Escenario: <Camino feliz>
    Dado <contexto>
    Cuando <acción única del comprador>
    Entonces <resultado observable>

  Escenario: <Error o borde>
    Dado <contexto>
    Cuando <acción>
    Entonces <mensaje o estado observable>
```

## 3. Reglas de negocio

- **RN-01**: <regla verificable con valores concretos>

## 4. Fuera de alcance

- <Lo que no se hace aquí>

## 5. Supuestos y preguntas abiertas

- **Supuesto**: <decisión no crítica asumida>

## 6. Notas para el diseño (no vinculantes)

- <Decisiones técnicas mencionadas por el usuario, textuales. Vacío si no hubo.>
````

---

## Ejemplo de referencia

````markdown
### HU-01: Retener una silla en exclusiva (Prioridad: P1)

Como Comprador quiero retener una silla disponible para que nadie más la compre mientras pago.

```gherkin
# language: es
Característica: Retener una silla en exclusiva

  Antecedentes:
    Dado que la silla "A-1" está disponible

  Escenario: Retener una silla disponible
    Cuando el comprador elige la silla "A-1"
    Entonces "A-1" aparece en su carrito con 90 segundos restantes
    Y los demás compradores ven "A-1" como retenida

  Escenario: Dos compradores eligen la misma silla al mismo tiempo
    Dado que 10 compradores eligen "A-1" en el mismo instante
    Cuando el sistema responde a todos
    Entonces exactamente 1 comprador tiene "A-1" en su carrito
    Y los otros 9 ven el mensaje "La silla A-1 ya no está disponible"

  Escenario: Silla ya vendida
    Dado que la silla "B-3" está vendida
    Cuando el comprador elige la silla "B-3"
    Entonces ve el mensaje "La silla B-3 ya no está disponible"
    Y su carrito no cambia
```
````
