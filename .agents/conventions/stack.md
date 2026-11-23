# Perfil técnico del proyecto

Lo leen `c-specify`, `c-clarify`, `c-plan` y `c-task`. Dos stacks: backend (Java) y frontend (JS).

| | Backend (`codigo_base/`) | Frontend (`client-js/`) |
| :--- | :--- | :--- |
| **Stack** | Java 17 + ZeroC Ice 3.7 + Gradle 8.6 | JavaScript ES6+ (ES Modules) + Webpack 5 + `ice` 3.7 (npm) |
| **Contrato** | `codigo_base/common/src/main/slice/BookingService.ice` | el mismo `.ice`, compilado con `slice2js` |
| **Código fuente** | `codigo_base/server/src/main/java/co/icesi/booking/server/` | `client-js/src/` |
| **Pruebas** | `codigo_base/server/src/test/java/co/icesi/booking/server/`, sufijo `Test.java` (JUnit 4) | sin pruebas automatizadas: verificación manual (ver abajo) |
| **Análisis** | `./gradlew build` -> `BUILD SUCCESSFUL` | `npm run build` -> `compiled successfully` |
| **Pruebas** | `./gradlew test` -> `BUILD SUCCESSFUL` | checklist manual de la tarea |
| **Una sola prueba** | `./gradlew :server:test --tests 'co.icesi.booking.server.<Clase>Test'` | — |
| **Bloques de código en `tasks.md`** | ninguno | ninguno |

Los comandos de backend se ejecutan desde `codigo_base/`; los de frontend desde `client-js/`.

## Entorno (obligatorio para compilar el backend)

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)   # Gradle 8.6 falla con JDK >= 22 ("Unsupported class file major version")
export ICE_HOME=/opt/homebrew                      # el plugin busca slice2java en /usr/local por defecto
```

## Verificaciones especiales

- **Concurrencia**: con el servidor corriendo (`./gradlew runServer`), `./gradlew :client:runClient --args="--test-concurrency"` debe mostrar `Peticiones que creyeron ganar el bloqueo : 1`.
- **Frontend manual**: servidor + `npm start` (http://localhost:3000), dos ventanas del navegador en paralelo; cada tarea dice qué observar.
- `--args` solo funciona con la ruta del subproyecto (`:client:runClient`, `:server:runServer`); con el alias raíz falla con `Unknown command-line option '--args'`.

## Términos de implementación prohibidos en specs

Para `grep -inwE` (fuera de "Notas para el diseño" se reescriben en lenguaje de negocio):

```text
java|javascript|typescript|webpack|npm|gradle|ice|zeroc|slice|rpc|websocket|tcp|servant|proxy|adapter|communicator|endpoint|api|json|dom|html|css|componente|component|módulo|hilo|thread|synchronized|hashmap|lockseat|releaseseat|confirmbooking|getallseats|puerto|servidor
```
