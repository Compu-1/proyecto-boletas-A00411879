# Convenciones de Git (git flow + Conventional Commits)

## 1. Ramas (git flow, ya inicializado)

| Rama | Uso | Comando |
| :--- | :--- | :--- |
| `master` | versiones entregadas; solo recibe merges de `release/` y `hotfix/` | — |
| `develop` | integración; base de toda feature | — |
| `feature/<slug>` | una por spec; `<slug>` = carpeta de `.agents/specs/<slug>/` | `git flow feature start <slug>` / `git flow feature finish <slug>` |
| `release/<versión>` | preparar una entrega (`1.0.0` = entrega final) | `git flow release start 1.0.0` / `git flow release finish 1.0.0` (crea tag `v1.0.0`) |
| `hotfix/<versión>` | corrección urgente sobre `master` | `git flow hotfix start 1.0.1` |

- Slugs en minúsculas `kebab-case`: `feature/concurrencia-backend`, `feature/mapa-sillas`.
- Cambios solo de `.agents/` o docs sueltos pueden ir en su propia feature (`feature/agents-<tema>`).
- Nunca commits directos en `master`.

## 2. Commits (Conventional Commits, exigido por la rúbrica)

```text
<tipo>(<alcance>): <descripción en minúsculas, imperativo, sin punto final, máx. 72 caracteres>
```

| Tipo | Uso |
| :--- | :--- |
| `feat` | funcionalidad nueva |
| `fix` | corrección de un fallo (p. ej. la condición de carrera) |
| `refactor` | reestructura sin cambiar comportamiento |
| `test` | pruebas nuevas o actualizadas |
| `docs` | documentación o `.agents/` |
| `chore` | dependencias, configuración, scripts |
| `style` | formato sin impacto lógico |

Alcances: `server`, `slice`, `client-java`, `client-js`, `agents`.

Ejemplos: `fix(server): sincroniza lockSeat para evitar doble bloqueo`, `feat(client-js): agrega mapa de sillas`, `docs(agents): registra decisión de polling`.

- Si hace falta contexto: línea en blanco y cuerpo con el porqué.
- Cada commit deja el proyecto compilando (`./gradlew build` / `npm run build`).
- Sin marcadores de conflicto: `grep -rn '<<<<<<<' codigo_base client-js` vacío.
