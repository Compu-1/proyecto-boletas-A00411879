# AGENTS.md

Guía para agentes de código (Claude Code, Codex u otros) en este repositorio.

## Proyecto

**Icesi Live Arena**: reserva de boletas con backend Java 17 + ZeroC Ice 3.7 (TCP 10000 + WebSocket 10002) y frontend SPA en JavaScript vainilla + Webpack. Proyecto final de Computación en Internet I (Icesi). Enunciado: `docs/Proyecto_Reserva_Boletas_Ice_Webpack.pdf` (fuente `.tex`); wireframe: `docs/mockup_componentes.png`.

## Mapa

| Ruta | Qué hay |
| :--- | :--- |
| `codigo_base/` | backend Gradle: `common/` (contrato Slice), `server/` (servant), `client/` (cliente Java de pruebas) |
| `client-js/` | frontend: SPA con Webpack (`src/js/api.js` es la única capa que habla con Ice) |
| `docs/` | enunciado (PDF y `.tex`), logo y wireframe |
| `README.md` | comandos de ejecución para personas (único README del repo) |
| `.agents/memory/constitution.md` | visión, rol, RF/RNF, rúbrica: **leer primero** |
| `.agents/memory/project_state.md` | estado actual, defectos conocidos, orden de trabajo |
| `.agents/memory/decisions.md` | decisiones de diseño (una fila cada una) |
| `.agents/memory/epics.md` | registro de historias de usuario |
| `.agents/conventions/` | `stack.md` (comandos y verificación), `backend.md`, `frontend.md`, `git.md` |
| `.agents/designs/` | `ui.md` (diseño "Sala a oscuras": negro, blanco, rojo) y `mockup.html` |
| `.agents/specs/<slug>/` | `spec.md`, `plan.md`, `tasks.md` de cada funcionalidad |
| `.agents/skills/` | flujo c-* adaptado a este repo |

## Flujo de trabajo

`c-specify` (qué) → `c-clarify` (dudas) → `c-plan` (cómo + decisiones) → `c-task` (tareas) → implementar en `feature/<slug>` con git flow → `git flow feature finish <slug>` hacia `develop` → `git flow release start <versión>` para entregar en `master`.

Las skills están en `.agents/skills/<nombre>/SKILL.md`; seguir esas versiones (las globales asumen Flutter).

## Comandos esenciales

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17) ICE_HOME=/opt/homebrew   # necesario antes de Gradle

cd codigo_base
./gradlew build                                         # Slice -> Java y compila todo
./gradlew runServer                                     # servidor
./gradlew :client:runClient --args="--test-concurrency" # prueba de estrés (debe ganar 1 hilo)
./gradlew :server:test --tests 'co.icesi.booking.server.<Clase>Test'

cd client-js
npm start        # dev server en http://localhost:3000
npm run build    # bundle de producción en dist/
```

Detalle y salidas esperadas: `.agents/conventions/stack.md`.

## Reglas generales

- **Contrato primero**: los cambios de interfaz empiezan en `BookingService.ice`; el código generado (`BookingApp`, `src/js/generated/`) nunca se edita.
- No quitar el `Thread.sleep(25)` de `lockSeat`; la concurrencia se corrige con exclusión mutua.
- Frontend sin frameworks; solo `api.js` habla con Ice; colores solo con los tokens de `designs/ui.md`.
- Toda decisión de diseño no trivial queda en `.agents/memory/decisions.md`: el código se sustenta oralmente.
- git flow + Conventional Commits (`.agents/conventions/git.md`). Nada directo a `master`.
- Código y nombres en inglés como el código base; textos de interfaz, logs, docs y commits en español.
