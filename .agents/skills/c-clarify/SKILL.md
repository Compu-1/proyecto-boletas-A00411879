---
name: c-clarify
description: Usar cuando ya existe .agents/specs/<slug>/spec.md (de c-specify) y hay que resolver dudas, ambigüedades o riesgos de alcance antes de planear o programar. Fase "ACLARAR" del flujo c-*.
---

# c-clarify: aclarar antes de construir

Interroga un spec con preguntas priorizadas para que **no se descubra tarde** lo necesario y **no se construya lo que nadie pidió**. Solo modifica el spec.

- **Entrada**: `.agents/specs/<slug>/spec.md`. Sin slug: listar `.agents/specs/`; si hay uno, usarlo; si hay varios, preguntar; si no hay, indicar `c-specify`.
- **Salida**: el mismo spec con `## 7. Aclaraciones` (formato en `banco-de-preguntas.md`) y `Estado: Aclarado`.

## Proceso

1. **Contexto**: leer el spec, `.agents/memory/constitution.md`, `.agents/memory/epics.md` y `.agents/memory/project_state.md` (defectos conocidos que el spec deba cubrir); de `stack.md` solo los términos prohibidos. No leer código.
2. **Escanear** contra cada categoría y la lista de funcionalidades implícitas de `banco-de-preguntas.md`.
3. **Filtrar**: preguntar solo si la respuesta cambia un criterio, una regla, el alcance o la prioridad. Con un valor por defecto razonable, registrarlo en "Supuestos". Descartar lo que ya responde la constitución (90 sillas, 90 segundos, precios).
4. **Preguntar** en rondas de **máximo 4**, por impacto: referencia (HU/RN), una decisión, 2 a 4 opciones con la **recomendada primero y su razón**, y la consecuencia de no decidir. En dudas de alcance, la recomendada es la de menor alcance y siempre existe "No incluir ahora". Usar la herramienta de preguntas interactivas si existe.
5. **Aplicar** cada respuesta en HU, escenarios, reglas, "Fuera de alcance" y "Supuestos" (reglas de `c-specify`). Si contradice otra parte, repreguntar.
6. **Repetir** mientras queden dudas críticas (máximo 3 rondas).
7. **Cerrar** con la tabla de cobertura y pedir aprobación. Reflejar en `epics.md` si se agregó, dividió o quitó una HU. No iniciar el plan.

## Frontera QUÉ / CÓMO

Preguntas de negocio y comportamiento observable. Nunca de tecnología, sincronización, contrato, componentes ni colores. Si la respuesta es técnica, va textual a "Notas para el diseño".

## Señales de alerta

| Pensamiento | Realidad |
| :--- | :--- |
| "Lo resuelvo al programar" | Si cambia el comportamiento, se pregunta ahora. |
| "Pregunto si uso `synchronized` o polling" | Es el CÓMO: va en `c-plan`. |
| "No hay nada que preguntar" | Recorrer todas las categorías y reportar cobertura. |
| "Esta función extra sería útil" | Preguntar; por defecto, fuera de alcance. |

## Checklist

- [ ] Spec, constitución, `epics.md` y `project_state.md` leídos.
- [ ] Todas las categorías revisadas y en la tabla de cobertura.
- [ ] Cada pregunta con referencia, opciones, recomendada y consecuencia; ninguna técnica.
- [ ] Respuestas aplicadas y registradas en "Aclaraciones".
- [ ] Sin términos prohibidos fuera de "Notas para el diseño".
- [ ] No se tocó `codigo_base/` ni `client-js/`.
