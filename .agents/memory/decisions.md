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
| D-010 | 2026-11-22 | Exclusión mutua con `synchronized` en las 10 operaciones del servant | Lo más simple de explicar (Sesión 8) y sin riesgo de interbloqueo; costo: las llamadas se atienden de a una | `specs/concurrencia-backend/plan.md` D1 |
| D-011 | 2026-11-22 | La retención vencida se muestra disponible al consultar (estado efectivo), sin barrido ni hilo | Nadie nota la diferencia, no hay hilos extra y el pago conserva el mensaje "ha expirado" | `specs/concurrencia-backend/plan.md` D2 |
| D-012 | 2026-11-22 | Las consultas del servant devuelven copias (`clone()`), no las sillas internas | Ice envía la respuesta fuera del candado; con copias cada respuesta es coherente | `specs/concurrencia-backend/plan.md` D3 |
| D-013 | 2026-11-22 | Reloj inyectable (`LongSupplier`) por constructor de paquete en `BookingServiceImpl` | Las pruebas comprueban 89 s y 90 s exactos sin esperar; sin dependencias nuevas | `specs/concurrencia-backend/plan.md` D4 |
| D-014 | 2026-11-22 | El contrato Slice no cambia; el rechazo nuevo usa `InvalidBookingException` | Sin regenerar stubs ni tocar clientes | `specs/concurrencia-backend/plan.md` D5 |
| D-015 | 2026-11-22 | Un solo `docs/` con el enunciado y el wireframe; un solo `README.md` en la raíz; artefactos de LaTeX fuera del repo | Raíz limpia (el enunciado exige `codigo_base/` y `client-js/` ahí); sin documentos duplicados ni regenerables | `docs/`, `README.md` |
| D-016 | 2026-11-22 | Clases Slice del navegador con el paquete npm `slice2js`, generadas en `prestart` y `prebuild` y fuera de git | Una sola fuente del contrato (`BookingService.ice`); nadie edita lo generado | `specs/tooling-webpack/plan.md` D1 |
| D-017 | 2026-11-22 | Falta de conexión: aviso de cierre de la conexión Ice más límite de 10 s por llamada; sin reintento automático | Apagar el servidor avisa al instante y sin tráfico extra; coincide con RN-04 y RN-05 | `specs/tooling-webpack/plan.md` D2 |
| D-018 | 2026-11-22 | `ConnectionBanner` pinta "Conectado" y el aviso de sin conexión; `ui.md` pierde el "REINTENTANDO" | Un componente por responsabilidad; el spec prohíbe reintentar | `specs/tooling-webpack/plan.md` D3 |
| D-019 | 2026-11-22 | Dependencias npm: `ice` 3.7.110; de desarrollo `webpack` 5, `webpack-cli`, `webpack-dev-server`, `html-webpack-plugin`, `style-loader`, `css-loader`, `slice2js` 3.7.110 | Lista del enunciado más `slice2js`; `dist/` se prueba con `python3 -m http.server`, sin otra dependencia | `specs/tooling-webpack/plan.md` D4 |
