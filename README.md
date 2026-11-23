# Icesi Live Arena

Sistema distribuido de reserva de boletas para un concierto de 90 sillas. Proyecto final de **Computación en Internet I** (09810 - TIC, NRC 12378), Universidad Icesi, 2026-2.

- **Backend** (`codigo_base/`): Java 17 + ZeroC Ice 3.7, escuchando en **TCP 10000** (clientes Java y pruebas) y **WebSocket 10002** (navegador).
- **Frontend** (`client-js/`, por crear): SPA en JavaScript vainilla con Webpack, conectada por WebSocket.

Ciclo de una silla: `AVAILABLE` -> `LOCKED` (retención exclusiva de 90 s) -> `BOOKED` (vendida, con código `RES-XXXXXXXX`).
Zonas: VIP (filas A-B, $120.000), Platea (C-E, $75.000) y General (F-I, $45.000), 10 sillas por fila.

## Estructura

```text
codigo_base/   backend Gradle: common/ (contrato Slice), server/ (servicio), client/ (cliente Java de consola)
client-js/     frontend (por crear)
docs/          enunciado (PDF y fuente LaTeX) y wireframe
.agents/       flujo de trabajo: convenciones, diseño, decisiones, specs y skills
AGENTS.md      guía para agentes de código (CLAUDE.md la importa)
```

## Backend

Requisitos: JDK 17 (Gradle 8.6 falla con JDK 22 o superior) y Ice 3.7 con `slice2java` instalado.

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS
export ICE_HOME=/opt/homebrew                      # donde Homebrew deja slice2java en Apple Silicon

cd codigo_base
./gradlew build                                        # genera Java desde Slice y compila todo
./gradlew runServer                                    # TCP 10000 + WebSocket 10002
./gradlew :server:runServer --args="--port 12000"      # otro puerto: TCP 12000, WebSocket 12002
./gradlew runClient                                    # cliente de consola (menú interactivo)
./gradlew :client:runClient --args="--host 10.0.0.5 --port 10000"
```

`--args` solo funciona con la ruta del subproyecto (`:client:` o `:server:`); con `./gradlew runClient --args=...` Gradle responde `Unknown command-line option '--args'`.

El contrato está en `codigo_base/common/src/main/slice/BookingService.ice`; el código Java generado queda en `common/build/` y no se edita.

### Prueba de concurrencia

Con el servidor corriendo, en otra terminal:

```bash
./gradlew :client:runClient --args="--test-concurrency"
```

Lanza 10 hilos que intentan retener la silla `A-1` al mismo tiempo. Resultado correcto: `Peticiones que creyeron ganar el bloqueo : 1`. Si reporta más de uno, falta exclusión mutua en `BookingServiceImpl`.

## Frontend

Pendiente. Requisitos (ver `docs/`): JavaScript sin frameworks, Webpack, `npm start` en el puerto 3000 y `npm run build` hacia `dist/`.

## Cómo se trabaja

Cada funcionalidad pasa por `/c-specify` -> `/c-clarify` -> `/c-plan` -> `/c-task` y se desarrolla en una rama `feature/<slug>` con git flow, con commits Conventional Commits. El estado y el orden de trabajo están en `.agents/memory/project_state.md`; las decisiones de diseño, en `.agents/memory/decisions.md`.
