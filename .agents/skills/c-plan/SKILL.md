---
name: c-plan
description: Usar cuando existe un spec aclarado o aprobado en .agents/specs/<slug>/spec.md y hay que diseñar el CÓMO (contrato Slice, servant, capas api/store/components del frontend, pruebas) y registrar las decisiones, sin escribir código de producción. Fase "PLAN" del flujo c-*.
---

# c-plan: diseñar el CÓMO y registrar las decisiones

Toma `.agents/specs/<slug>/spec.md` y escribe `.agents/specs/<slug>/plan.md` con `plan-template.md` (esta carpeta).

## Reglas

1. **Sin código de producción**: solo archivos, firmas públicas (operaciones Slice, métodos, funciones exportadas, callbacks) y responsabilidades.
2. **Contexto**: leer `.agents/conventions/` completo, `.agents/designs/ui.md` (si toca la interfaz), `.agents/memory/project_state.md` y `decisions.md`. Inspeccionar el código real de `codigo_base/` y `client-js/`: reutilizar antes de crear.
3. **Capas** (orden de la tabla de impacto):
   - **slice**: `BookingService.ice`. Solo si cambia el contrato (regla de oro: contrato primero).
   - **server**: `BookingServiceImpl` (lógica, concurrencia), `BookingServerApp` (solo configuración).
   - **api / store / components / app / css** del frontend, según `conventions/frontend.md`.
4. **Decisiones obligatorias**: toda elección no trivial (mecanismo de exclusión mutua, cómo se refresca el mapa, dónde vive el temporizador, cambio de contrato, dependencia npm nueva) va en "Decisiones" con contexto, opciones, elegida y por qué. Al aprobarse, una fila por decisión en `.agents/memory/decisions.md`.
5. **Dependencias nuevas** (Gradle o npm): marcarlas como decisión a confirmar con el usuario.
6. **Pruebas**: cada escenario Gherkin queda asignado a una prueba JUnit (`server/src/test/...`) o a una verificación manual con qué observar.
7. **Explicable**: preferir la opción más simple que cumpla el spec; el estudiante debe poder defenderla en la sustentación.
8. **Tamaño**: máximo 120 líneas. Mermaid solo si aclara un flujo. Sin emojis.

## Flujo

1. Confirmar spec `Aclarado` o `Aprobado`; si está en `Borrador`, indicar `c-clarify`.
2. Mapear por capa lo que se crea o modifica.
3. Redactar decisiones y pruebas.
4. Presentar resumen y pedir aprobación. Tras aprobar: actualizar `decisions.md`. No iniciar tareas ni código.
