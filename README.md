# Icesi Live Arena

Distributed ticket booking system for a 90-seat concert. Final project for **Computación en Internet I** (09810 - TIC, NRC 12378), Universidad Icesi, 2026-2.

- **Backend** (`codigo_base/`): Java 17 + ZeroC Ice 3.7, listening on **TCP 10000** (Java clients and tests) and **WebSocket 10002** (browser).
- **Frontend** (`client-js/`): vanilla JavaScript SPA built with Webpack, connected over WebSocket.

Seat lifecycle: `AVAILABLE` -> `LOCKED` (exclusive 90 s hold) -> `BOOKED` (sold, with code `RES-XXXXXXXX`).
Zones: VIP (rows A-B, $120.000), Platea (C-E, $75.000) and General (F-I, $45.000), 10 seats per row.

## Structure

```text
codigo_base/   Gradle backend: common/ (Slice contract), server/ (service), client/ (Java console client)
client-js/     frontend: vanilla JavaScript SPA with Webpack
docs/          assignment (PDF and LaTeX source) and wireframe
.agents/       workflow: conventions, design, decisions, specs and skills
AGENTS.md      guide for coding agents (CLAUDE.md imports it)
```

## Backend

Requirements: JDK 17 (Gradle 8.6 fails with JDK 22 or later) and Ice 3.7 with `slice2java` installed.

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # macOS
export ICE_HOME=/opt/homebrew                      # where Homebrew puts slice2java on Apple Silicon

cd codigo_base
./gradlew build                                        # generates Java from Slice and compiles everything
./gradlew runServer                                    # TCP 10000 + WebSocket 10002
./gradlew :server:runServer --args="--port 12000"      # another port: TCP 12000, WebSocket 12002
./gradlew runClient                                    # console client (interactive menu)
./gradlew :client:runClient --args="--host 10.0.0.5 --port 10000"
```

`--args` only works with the subproject path (`:client:` or `:server:`); with `./gradlew runClient --args=...` Gradle answers `Unknown command-line option '--args'`.

The contract lives in `codigo_base/common/src/main/slice/BookingService.ice`; the generated Java code is placed in `common/build/` and is never edited.

### Concurrency test

With the server running, in another terminal:

```bash
./gradlew :client:runClient --args="--test-concurrency"
```

It launches 10 threads that try to lock seat `A-1` at the same time. Correct result: `Peticiones que creyeron ganar el bloqueo : 1`. If it reports more than one, `BookingServiceImpl` is missing mutual exclusion.

## Frontend

Requirements: Node 22 or later (tested with 25) and the server running (`./gradlew runServer`).

```bash
cd client-js
npm install        # once
npm start          # development at http://localhost:3000
npm run build      # production build in dist/
python3 -m http.server 8080 -d dist   # optional: serve dist/ at http://localhost:8080
```

`npm start` and `npm run build` generate the Ice stubs (`src/js/generated/`) on their own from the same `BookingService.ice` used by the backend; that folder is neither versioned nor edited. The browser talks to the server only over WebSocket (port 10002 of the same host as the page). Without a connection it shows a warning and the page must be reloaded.
