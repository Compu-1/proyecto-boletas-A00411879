---
name: c-specify
description: Usar cuando el usuario plantea un requerimiento o funcionalidad de Icesi Live Arena y hay que especificarlo (historias de usuario y criterios de aceptación en Gherkin) antes de planear o implementar. Fase "QUÉ" del flujo c-*.
---

# c-specify: especificar el QUÉ

Convierte un requerimiento en **historias de usuario + criterios Gherkin**. Describe solo **qué** puede hacer el Comprador y qué observa. El **cómo** (backend, frontend, contrato, componentes) es de `c-plan`.

- **Entrada**: requerimiento en texto libre (o un slug de la lista "Siguiente" de `.agents/memory/project_state.md`).
- **Salida**: `.agents/specs/<slug>/spec.md` con `spec-template.md` (esta carpeta). `<slug>` en `kebab-case`; será también la rama `feature/<slug>`.

## Proceso

1. **Contexto**: leer `.agents/memory/constitution.md` (rol, RF, RNF, inventario), `.agents/memory/epics.md` (numeración, duplicados), `.agents/specs/` y, de `.agents/conventions/stack.md`, solo la lista de términos prohibidos. No leer código fuente.
2. **Aclarar**: si una ambigüedad cambia el comportamiento, preguntar (máximo 3 por ronda, opciones con la recomendada primero). Lo no crítico va a "Supuestos".
3. **Descomponer** en historias independientes y priorizadas (P1, P2...), cada una entregable y verificable por separado. Si ya existe en `epics.md`, reutilizar su número.
4. **Redactar**: `Como Comprador quiero <capacidad> para <beneficio>`. Un requerimiento técnico (p. ej. RNF-1) se expresa por lo que el Comprador observa ("nadie más obtiene la silla que retuve").
5. **Criterios** en Gherkin (reglas abajo), citando el RF/RNF que cubren.
6. **Verificar** con el checklist y **presentar** el resumen. Tras la aprobación: registrar las HU en `epics.md`. No iniciar el plan ni el código.

## Tamaño

Máximo 3 HU y 150 líneas por spec; máximo 5 escenarios por HU. Si no alcanza, dividir en varios specs y proponer el orden.

## Reglas Gherkin

- Primera línea `# language: es`. Palabras: `Característica`, `Antecedentes`, `Escenario`, `Esquema del escenario`, `Ejemplos`, `Dado`, `Cuando`, `Entonces`, `Y`.
- Cubrir camino feliz, errores, validaciones y bordes propios de la taquilla: dos compradores a la vez, retención que expira, silla ya vendida, carrito vacío, sin conexión.
- Declarativo y en lenguaje de negocio; un solo `Cuando` por escenario; datos concretos (`A-1`, 90 segundos, $120.000).
- Sin adjetivos vagos: valores medibles.

## Frontera QUÉ / CÓMO

| Spec (QUÉ) | Plan (CÓMO) |
| :--- | :--- |
| Comportamiento observable, reglas, mensajes al Comprador, tiempos y límites | Lenguajes, Ice, contrato, métodos remotos, sincronización, componentes, colores, archivos |

Si el usuario menciona una decisión técnica, copiarla textual en "Notas para el diseño" y no usarla en historias ni criterios.

## Checklist

- [ ] Cada HU usa el rol Comprador, con capacidad y beneficio, y cita RF/RNF.
- [ ] Cada HU tiene camino feliz y al menos un error o borde.
- [ ] Sin términos prohibidos fuera de "Notas para el diseño": `grep -inwE '<términos de stack.md>' .agents/specs/<slug>/spec.md`
- [ ] Máximo 3 HU, 5 escenarios por HU, 150 líneas (`wc -l`).
- [ ] "Fuera de alcance" y "Supuestos" completos.
