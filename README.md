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
docs/          assignment (PDF and LaTeX source), wireframe, demo walkthrough and demo video
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

`npm start` and `npm run build` generate the Ice stubs (`src/js/generated/`) on their own from the same `BookingService.ice` used by the backend; that folder is neither versioned nor edited. The browser talks to the server only over WebSocket: port 10002 of the same host as the page, or `/ws` on port 80 when the page is served by Nginx (see below). Without a connection it shows a warning and the page must be reloaded.

## Deployment on a VM

The VM serves `dist/` with Nginx on port 80 and runs the server as the `systemd` service `icesi-live-arena`, which starts with the VM and restarts on its own if it fails. Nginx forwards the browser WebSocket from `/ws` to port 10002, so the browser only needs port 80. VM requirements: Ubuntu 22.04 or later, `sudo` and internet access (the installer adds Java 17 and Nginx if they are missing).

1. On the Mac, build the package (jar with Ice inside, `dist/` and the installer):

   ```bash
   ./deploy/package.sh        # -> deploy/build/icesi-live-arena.tar.gz
   ```

2. Copy it to the VM and install it (it can be run again to update):

   ```bash
   scp deploy/build/icesi-live-arena.tar.gz <user>@<vm-ip>:
   ssh <user>@<vm-ip>
   tar xzf icesi-live-arena.tar.gz
   cd icesi-live-arena && sudo ./install.sh
   ```

3. Open `http://<vm-ip>` from any computer in the room. The installer prints the VM time: compare it with the computer's clock (the countdown uses the browser clock; a gap over 2 s shifts it).

Useful commands on the VM: `journalctl -u icesi-live-arena -f` (server log), `sudo systemctl restart icesi-live-arena`, `sudo nginx -t`. Without internet on the VM, install `openjdk-17-jre-headless` and `nginx` by hand first; the installer then skips that step.

To rehearse it locally with [Multipass](https://multipass.run) (a real Ubuntu VM on the Mac):

```bash
multipass launch 24.04 --name arena
multipass transfer deploy/build/icesi-live-arena.tar.gz arena:
multipass exec arena -- bash -c 'tar xzf icesi-live-arena.tar.gz && cd icesi-live-arena && sudo ./install.sh'
multipass delete --purge arena   # when done
```

## Demo

Step-by-step manual test of the whole system (server, concurrency test, Webpack and the buyer flow in two windows), in Spanish: [`docs/demostracion.md`](docs/demostracion.md).

Demo video (5:50, in Spanish): [`docs/video-demostracion.mp4`](docs/video-demostracion.mp4).
