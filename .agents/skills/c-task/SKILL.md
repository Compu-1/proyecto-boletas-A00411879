---
name: c-task
description: Usar cuando existen spec y plan aprobados en .agents/specs/<slug>/ y hay que dividir la implementación en tareas atómicas y verificables con checkboxes y commit sugerido, sin escribir código. Fase "TAREAS" del flujo c-*.
---

# c-task: tareas cortas y verificables

Convierte `.agents/specs/<slug>/plan.md` en `.agents/specs/<slug>/tasks.md` con `tasks-template.md` (esta carpeta).

## Reglas

1. **Sin código**: ni bloques de Java o JS, ni diffs. Cada acción es una frase que nombra archivo y símbolo.
2. **Tamaño**: máximo 8 tareas y 100 líneas. Si no alcanza, proponer dividir el spec.
3. **Rama**: la primera tarea indica `git flow feature start <slug>` (desde `develop`). Nada se hace en `master`.
4. **Atomicidad**: cada tarea deja todo compilando y termina en un commit Conventional Commits (`conventions/git.md`).
5. **Orden**: slice, server, pruebas JUnit, api, store, components, app y css, cierre. Marcar `(paralela)` las independientes.
6. **Verificación** por tarea con los comandos de `conventions/stack.md` (con `JAVA_HOME` e `ICE_HOME` exportados): `./gradlew build`, la prueba puntual, `--test-concurrency` si toca concurrencia, `npm run build`. Lo visual se verifica a mano diciendo qué observar (dos ventanas si hay competencia entre compradores).
7. **Seguimiento**: marcar `- [x]` solo tras verificar. Sin bitácoras.
8. **Cierre**: la última tarea actualiza `project_state.md`, `epics.md` y, si hubo decisiones nuevas, `decisions.md`; luego `git flow feature finish <slug>` solo si el usuario lo pide.
9. Sin emojis. No hacer commit sin que el usuario lo pida.
