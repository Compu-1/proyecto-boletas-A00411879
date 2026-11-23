# Tareas: <Nombre de la funcionalidad>

- **Plan**: [plan.md](plan.md) · **Rama**: `feature/<slug>` · **Fecha**: <AAAA-MM-DD>

## Resumen

- [ ] T1: <título>
- [ ] T2: <título> (paralela)
- [ ] T3: Cierre

## T1: <título>
- **Rama**: `git flow feature start <slug>` (solo en la primera tarea)
- **Archivos**: `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServiceImpl.java` (modificar), `codigo_base/server/src/test/java/co/icesi/booking/server/<X>Test.java` (crear)
- **Acciones**:
  - [ ] <frase: qué cambia y en qué símbolo>
  - [ ] <prueba que cubre "HU-NN: escenario">
- **Verificación**: [ ] `./gradlew build` · [ ] `./gradlew :server:test --tests 'co.icesi.booking.server.<X>Test'`
- **Commit**: `fix(server): <descripción>`

## T2: <título de frontend>
- **Archivos**: `client-js/src/js/components/<X>.js` (crear), `client-js/src/css/main.css` (modificar)
- **Acciones**:
  - [ ] <frase>
- **Verificación**: [ ] `npm run build` · [ ] manual: <qué observar en el navegador>
- **Commit**: `feat(client-js): <descripción>`

## T3: Cierre
- [ ] `./gradlew build`, `./gradlew test` y `npm run build` en verde (lo que aplique)
- [ ] Actualizar `project_state.md`, `epics.md` y `decisions.md`
- **Commit**: `docs(agents): <descripción>`
- [ ] `git flow feature finish <slug>` (si el usuario lo pide)
