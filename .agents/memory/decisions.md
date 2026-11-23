# Decisiones de diseño

Una línea por decisión: qué se eligió, por qué y dónde está el detalle. Las agrega `c-plan` al aprobar un plan y `c-task` si surgen al implementar. Para cambiar una, se agrega una nueva que la reemplace (no se borra la anterior).

| ID | Fecha | Decisión | Por qué | Detalle |
| :--- | :--- | :--- | :--- | :--- |
| D-001 | 2026-11-22 | Frontend en JavaScript ES6+, no TypeScript | Igual que los apuntes (Sesión 11-12), sin paso extra de compilación, más fácil de sustentar | `conventions/frontend.md` |
| D-002 | 2026-11-22 | Frontend en capas `api` / `store` / `components` / `app`, flujo en una dirección | Separación de responsabilidades de la Sesión 11; solo `api.js` conoce Ice | `conventions/frontend.md` |
| D-003 | 2026-11-22 | git flow (`master` entregas, `develop` integración, `feature/<slug>` = slug del spec, tags `v`) | Flujo pedido por el estudiante; cada spec queda trazable a una rama | `conventions/git.md` |
| D-004 | 2026-11-22 | `AGENTS.md` es la guía única; `CLAUDE.md` solo la importa | Codex y Claude leen las mismas reglas | `AGENTS.md` |
| D-005 | 2026-11-22 | Skills c-* versionadas en `.agents/skills/`, adaptadas a Java + JS; mandan sobre las globales | Las globales asumen Flutter | `.agents/skills/` |
| D-006 | 2026-11-22 | Un solo rol de negocio: Comprador | El enunciado solo describe al cliente que reserva | `memory/constitution.md` |
| D-007 | 2026-11-22 | Pruebas automatizadas solo en backend (JUnit 4); frontend con verificación manual multiventana | La rúbrica evalúa concurrencia en el servidor; el enunciado pide prueba manual con varias ventanas | `conventions/stack.md` |
| D-008 | 2026-11-22 | Diseño "Sala a oscuras": negro, blanco y rojo; rojo solo para lo del comprador y lo urgente | Pedido del estudiante: poco común pero sencillo | `designs/ui.md` |
| D-009 | 2026-11-22 | Sin `c-standardize` | Servía para copiar el estilo de otro proyecto Flutter; aquí las convenciones se escriben desde cero | `.agents/conventions/` |
