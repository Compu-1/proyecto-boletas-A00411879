# Plan: Despliegue en una VM de la sala

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/despliegue-vm` · **Fecha**: 2026-11-23 · **Estado**: Terminado

## Resumen

En el Mac se arma un paquete `icesi-live-arena.tar.gz` con el jar del servidor (Ice adentro), `dist/` y la carpeta `deploy/`. En la VM, `sudo ./install.sh` instala Java 17 y Nginx si faltan, publica `dist/` en `/var/www/icesi-live-arena/`, deja el servidor como servicio `systemd` con reinicio automático y hace que Nginx atienda en el 80 y pase el WebSocket de `/ws` al 10002 local. El navegador decide el canal según cómo se abrió: en `npm start` (3000) sigue con `ws://<host>:10002`; servido por Nginx usa `ws://<host>/ws`. Todo se prueba antes en una VM Ubuntu local con Multipass.

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| build | `codigo_base/server/build.gradle` | modificar | tarea `jar`: `Main-Class` = `BookingServerApp` y dependencias de `runtimeClasspath` dentro del jar -> `server/build/libs/server.jar` (`java -jar`) |
| api | `client-js/src/js/api.js` | modificar | función interna `wsEndpoint()`: página en el 80 (`port` vacío o `'80'`) -> `ws -h <host> -p 80 -r /ws`; otro puerto -> `ws -h <host> -p 10002`. `connect` no cambia de firma |
| build | `client-js/webpack.config.js` | modificar | `output.publicPath: '/'` para que una ruta profunda pida `/bundle...js` (D-049, agregado en T6) |
| deploy | `deploy/package.sh` | crear | en el Mac: `./gradlew :server:jar` + `npm run build` y empaqueta `server.jar`, `dist/`, `install.sh`, `.conf` y `.service` en `deploy/build/icesi-live-arena.tar.gz` |
| deploy | `deploy/install.sh` | crear | en la VM, idempotente: `apt-get install` de `openjdk-17-jre-headless` y `nginx` si faltan; copia jar a `/opt/icesi-live-arena/` y `dist/` a `/var/www/icesi-live-arena/`; activa el sitio (quita `default`), `nginx -t`, `systemctl reload nginx`, `systemctl enable --now`; al final imprime la dirección y `date` |
| deploy | `deploy/icesi-live-arena.conf` | crear | `server` de Nginx: `listen 80 default_server`, `root`, `try_files $uri /index.html`, `gzip` (js, css), caché larga para `bundle.*.js`, `location /ws` con `proxy_pass http://127.0.0.1:10002/`, `Upgrade`/`Connection` y `proxy_read_timeout 120s` |
| deploy | `deploy/icesi-live-arena.service` | crear | unidad `systemd`: `ExecStart=/usr/bin/java -jar /opt/icesi-live-arena/server.jar`, `Restart=always`, `RestartSec=3`, `DynamicUser=yes`, `WantedBy=multi-user.target` |
| repo | `.gitignore` | modificar | ignorar `deploy/build/` |
| docs | `README.md` | modificar | sección "Despliegue en la VM": empaquetar en el Mac y los 4 comandos en la sala (`scp`, `ssh`, `tar xzf`, `sudo ./install.sh`), comparar `date` y cómo ver el log (`journalctl -u icesi-live-arena`) |

Sin cambios en `BookingService.ice`, `BookingServiceImpl` ni `BookingServerApp` (ya escucha en `0.0.0.0`).

## Decisiones

### D1: Cómo llega el navegador al canal WebSocket
- **Contexto**: el enunciado usa `ws://localhost:10002`; en la sala no sabemos si el firewall deja pasar el 10002 (RN-01: solo la dirección).
- **Opciones**: A) directo al 10002. B) Nginx en el 80 pasa `/ws` al 10002 local (pedido por el usuario).
- **Elegida**: B, conservando A en desarrollo — **Por qué**: solo depende del 80, que Nginx ya necesita; sigue siendo WebSocket de Ice (RNF-4) y es el `proxy_pass` de la Sesión 12. El 10002 queda abierto igual, así que A también funciona si el firewall lo deja.

### D2: Cómo distingue `api.js` desarrollo de producción
- **Contexto**: un mismo código debe servir en `npm start` y detrás de Nginx.
- **Opciones**: A) mirar `window.location.port` en tiempo de ejecución. B) constante inyectada por Webpack (`DefinePlugin`) según `--mode`.
- **Elegida**: A — **Por qué**: una línea, sin tocar `webpack.config.js`, y se explica sola: "si la página vino de Nginx (80), voy por `/ws` del mismo origen; si no, voy directo al 10002" (regla invertida en T6 para no romper la vista previa en el 8080).

### D3: Cómo se ejecuta el servidor en la VM
- **Contexto**: la VM no debe necesitar Gradle, `slice2java` ni `ICE_HOME`.
- **Opciones**: A) jar con dependencias armado por la tarea `jar` de Gradle. B) `installDist` (carpeta con script y `lib/`). C) plugin Shadow.
- **Elegida**: A — **Por qué**: un solo archivo y `java -jar`, sin plugins nuevos; Ice es una librería Java de Maven y viaja dentro del jar.

### D4: Cómo se mantiene vivo el servidor (HU-15)
- **Opciones**: A) servicio `systemd` con `Restart=always`. B) `nohup` en la sesión SSH.
- **Elegida**: A — **Por qué**: arranca con la VM (`enable`), se levanta a los 3 s si cae (escenario de 10 s) y sus logs quedan en `journalctl`. `DynamicUser=yes` lo corre sin privilegios sin crear usuarios a mano.

### D5: Cómo se lleva el código a la VM
- **Opciones**: A) paquete armado en el Mac y copiado con `scp`. B) `git clone` y compilar en la VM.
- **Elegida**: A — **Por qué**: compilar en la VM exige JDK, Node e Ice; el paquete solo exige Java 17 (RN-03, RN-04: no viaja `src/` ni `node_modules/`).

### D6: Dónde se prueba sin la VM real (a confirmar: herramienta nueva)
- **Contexto**: no hay acceso a la sala; el Mac no tiene Docker; un contenedor no trae `systemd` ni permite probar un reinicio.
- **Opciones**: A) Multipass (`brew install --cask multipass`): VM Ubuntu 24.04 real. B) Docker (Colima) con Ubuntu. C) solo Nginx de Homebrew en el Mac.
- **Elegida**: A — **Por qué**: es la única que prueba `apt`, `systemd` y el reinicio igual que en la sala. Se instala solo en el Mac, no en el proyecto.

## Pruebas

Sin pruebas JUnit nuevas: no cambia la lógica del servidor. Antes de cada verificación: `./gradlew build` y `npm run build` sin errores. Todas en la VM de Multipass (`multipass launch 24.04 --name arena`), instalando con los mismos comandos del README.

| Escenario del spec | Tipo | Qué observar |
| :--- | :--- | :--- |
| HU-14: abrir con solo la dirección | manual | `http://<ip de arena>` muestra evento, precios y 90 sillas; `http://<ip>/cualquier/ruta` también (RN-01) |
| HU-14: dos equipos ven los cambios | manual | dos ventanas contra la VM; retener `A-1` en una y verla retenida en la otra en máximo 2 s |
| HU-14: flujo completo | manual | retener `A-1` y `F-3`, pagar como "Ana Pérez", ver `RES-` + 8 y $165.000 |
| HU-14: cuenta regresiva | manual | `date` en la VM frente al Mac con diferencia menor a 2 s; `B-4` arranca entre 88 y 90 s y se libera a los 90 s |
| HU-14: deja de atender | manual | `sudo systemctl stop icesi-live-arena`: aviso de sin conexión en máximo 1 s |
| HU-15: reinicio de la VM | manual | `multipass restart arena`; en máximo 60 s la página recargada muestra el plano |
| HU-15: se cae sola | manual | `sudo systemctl kill -s KILL icesi-live-arena`; a los 10 s la recarga muestra el plano |
| HU-15: sillas disponibles tras reiniciar | manual | vender `A-1`, reiniciar el servicio, ver 90 disponibles |
| RN-03, RN-04 | manual | `install.sh` en VM limpia termina sin error; correrlo dos veces no falla; `/var/www/icesi-live-arena/` solo tiene `index.html` y `bundle.*.js` |
| RNF-1 en la VM | manual | `--test-concurrency` sigue dando 1 en el Mac (no cambia la lógica) |

## Riesgos y pendientes

- La VM de la sala puede no tener internet para `apt`; plan B en README: instalar Java y Nginx a mano o pedirlos al monitor.
- Ubuntu anterior a 22.04 puede no traer `openjdk-17`: `install.sh` se detiene con un mensaje claro.
- Hay que confirmar en Multipass que el WebSocket de Ice acepta la ruta reescrita por Nginx (`/ws` -> `/`); si no, se usa `-r /ws` también en el servidor.
- Para la sala hay que llevar el paquete: en el Mac o adjunto a un release de GitHub y descargado con `curl`.
- No hay HTTPS: el navegador muestra "No seguro"; está fuera de alcance.
