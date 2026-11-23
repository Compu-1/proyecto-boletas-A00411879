# Tareas: Despliegue en una VM de la sala

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/despliegue-vm` · **Fecha**: 2026-11-23

Comandos de `codigo_base/` con `JAVA_HOME` e `ICE_HOME` exportados (`conventions/stack.md`); comandos de `client-js/` desde esa carpeta; los de `deploy/` desde la raíz. Sin pruebas JUnit nuevas (no cambia la lógica del servidor): lo de la VM se verifica a mano en Multipass con la tabla "Pruebas" del plan.

## Resumen

- [x] T1: Rama y documentos del spec
- [x] T2: Jar ejecutable del servidor
- [x] T3: Canal WebSocket según el origen en `api.js` (paralela con T2)
- [x] T4: Configuración de Nginx y servicio `systemd` (paralela con T2 y T3)
- [ ] T5: Scripts `package.sh` e `install.sh`
- [ ] T6: Prueba completa en la VM de Multipass
- [ ] T7: Pasos de despliegue en el README
- [ ] T8: Cierre

## T1: Rama y documentos del spec
- **Rama**: `git flow feature start despliegue-vm` (desde `develop`; lleva los cambios sin commit de spec, plan, tareas, `epics.md` y `decisions.md`)
- **Archivos**: `.agents/specs/despliegue-vm/` (spec, plan, tasks), `.agents/memory/decisions.md`, `.agents/memory/epics.md`, `.agents/conventions/git.md`
- **Acciones**:
  - [x] En `git.md`, agregar el alcance `deploy` (carpeta `deploy/`).
  - [x] Commit con spec y plan aprobados, tareas, D-043 a D-048 y HU-14 y HU-15 en `epics.md`.
- **Verificación**: [x] `git status --short` vacío · [x] `git branch --show-current` = `feature/despliegue-vm`
- **Commit**: `docs(agents): aprueba spec y plan de despliegue-vm`

## T2: Jar ejecutable del servidor
- **Archivos**: `codigo_base/server/build.gradle` (modificar)
- **Acciones**:
  - [x] Configurar la tarea `jar`: `Main-Class` `co.icesi.booking.server.BookingServerApp`, meter las clases de `runtimeClasspath` (Ice y `common`), excluir firmas `META-INF/*.SF|*.DSA|*.RSA` y `duplicatesStrategy` para repetidos (D-045).
- **Verificación**: [x] `./gradlew build` · [x] `java -jar server/build/libs/server.jar` arranca en 10000 y 10002 sin Gradle · [x] con ese jar corriendo, `--test-concurrency` da 1
- **Commit**: `chore(server): genera un jar ejecutable con dependencias`

## T3: Canal WebSocket según el origen en `api.js` (paralela con T2)
- **Archivos**: `client-js/src/js/api.js` (modificar)
- **Acciones**:
  - [x] Agregar la función interna `wsEndpoint()`: con `window.location.port === '3000'` devuelve `ws -h <host> -p 10002`; si no, `ws -h <host> -p <puerto de la página o 80> -r /ws`; usarla en `connect` con un comentario que cite D-044.
- **Verificación**: [x] `npm run build` · [x] manual: con `npm start` la taquilla conecta como antes (plano, retener `A-1`)
- **Commit**: `feat(client-js): elige el canal websocket según el origen de la página`

## T4: Configuración de Nginx y servicio `systemd` (paralela con T2 y T3)
- **Archivos**: `deploy/icesi-live-arena.conf`, `deploy/icesi-live-arena.service` (crear)
- **Acciones**:
  - [x] Crear el `server` de Nginx: `listen 80 default_server`, `root /var/www/icesi-live-arena`, `try_files $uri /index.html`, `gzip` para JS y CSS, caché de 1 año para `bundle.*.js` y `location /ws` con `proxy_pass http://127.0.0.1:10002/`, `proxy_http_version 1.1`, `Upgrade`, `Connection "upgrade"` y `proxy_read_timeout 120s`; un comentario por bloque (D-043).
  - [x] Crear la unidad `systemd` con `After=network.target`, `ExecStart=/usr/bin/java -jar /opt/icesi-live-arena/server.jar`, `Restart=always`, `RestartSec=3`, `DynamicUser=yes` y `WantedBy=multi-user.target` (D-046).
- **Verificación**: [x] revisión contra la tabla del plan (se prueban de verdad en T6)
- **Commit**: `chore(deploy): agrega la configuración de nginx y el servicio systemd`

## T5: Scripts `package.sh` e `install.sh`
- **Archivos**: `deploy/package.sh`, `deploy/install.sh` (crear, ejecutables), `.gitignore` (modificar)
- **Acciones**:
  - [ ] `package.sh` (Mac, `set -e`): exporta `JAVA_HOME` e `ICE_HOME`, corre `./gradlew :server:jar` y `npm run build` y arma `deploy/build/icesi-live-arena.tar.gz` con `server.jar`, `dist/`, `install.sh`, `.conf` y `.service` (D-047).
  - [ ] `install.sh` (VM, `set -e`, exige `sudo`): instala `openjdk-17-jre-headless` y `nginx` solo si faltan (se detiene con mensaje si no hay `openjdk-17`); copia el jar a `/opt/icesi-live-arena/` y `dist/` a `/var/www/icesi-live-arena/` (borrando el `dist/` anterior); copia la unidad y el sitio, quita el sitio `default`, `nginx -t`, `systemctl reload nginx`, `systemctl daemon-reload`, `systemctl enable --now` y `restart` del servicio; al final imprime `http://<ip>` y `date`. Mensajes en español.
  - [ ] Ignorar `deploy/build/` en `.gitignore`.
- **Verificación**: [ ] `bash -n deploy/*.sh` · [ ] `./deploy/package.sh` termina y `tar tzf` lista solo esos archivos, sin `src/` ni `node_modules/` (RN-04)
- **Commit**: `chore(deploy): agrega los scripts de empaquetado e instalación`

## T6: Prueba completa en la VM de Multipass
- **Archivos**: los de T2 a T5 si algo falla
- **Acciones**:
  - [ ] Instalar Multipass (`brew install --cask multipass`, D-048) y crear `multipass launch 24.04 --name arena`.
  - [ ] Copiar el paquete (`multipass transfer`), descomprimir y correr `sudo ./install.sh` en la VM limpia; correrlo una segunda vez sin errores (RN-03).
  - [ ] Confirmar que el WebSocket de Ice acepta la ruta `/ws` reescrita por Nginx; si no, ajustar (riesgo del plan) y registrar la decisión.
  - [ ] Recorrer la tabla "Pruebas" del plan: HU-14 (dirección y ruta inexistente, dos ventanas, compra completa, `date` y cuenta de 88 a 90 s, servicio detenido) y HU-15 (`multipass restart arena` en máximo 60 s, `systemctl kill -s KILL` y recarga a los 10 s, 90 disponibles tras reiniciar).
- **Verificación**: [ ] todos los escenarios de la tabla observados · [ ] `/var/www/icesi-live-arena/` solo tiene `index.html` y `bundle.*.js`
- **Commit**: `fix(deploy): <ajuste>` solo si hubo cambios
- [ ] Al terminar: `multipass delete --purge arena` si el usuario lo pide

## T7: Pasos de despliegue en el README
- **Archivos**: `README.md` (modificar)
- **Acciones**:
  - [ ] Sección "Despliegue en la VM": requisitos (Ubuntu 22.04 o superior, `sudo`, internet), `./deploy/package.sh` en el Mac, los 4 comandos de la sala (`scp`, `ssh`, `tar xzf`, `sudo ./install.sh`), comparar `date` con el reloj del equipo (D-031), ver logs con `journalctl -u icesi-live-arena` y plan B sin internet; cómo repetir la prueba con Multipass.
- **Verificación**: [ ] los comandos coinciden con los usados en T6
- **Commit**: `docs: agrega los pasos de despliegue en la vm`

## T8: Cierre
- [ ] `./gradlew build`, `./gradlew test` y `npm run build` en verde
- [ ] Actualizar `project_state.md` (despliegue listo, pendiente repetirlo en la sala), `epics.md` (HU-14 y HU-15 quedan `[ ]` hasta hacerlo en la sala) y `decisions.md` si hubo decisiones en T6
- **Commit**: `docs(agents): cierra despliegue-vm`
- [ ] `git flow feature finish despliegue-vm` (si el usuario lo pide)
