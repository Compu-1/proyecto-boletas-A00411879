# Plan: <Nombre de la funcionalidad>

- **Spec**: [spec.md](spec.md) · **Rama**: `feature/<slug>` · **Fecha**: <AAAA-MM-DD> · **Estado**: Borrador | Aprobado | En curso | Terminado

## Resumen

<2 a 4 frases: cómo se resuelve el spec.>

## Impacto por capa

| Capa | Archivo | Acción | Responsabilidad / firma pública |
| :--- | :--- | :--- | :--- |
| slice | `codigo_base/common/src/main/slice/BookingService.ice` | modificar | <operación o campo> |
| server | `codigo_base/server/src/main/java/co/icesi/booking/server/BookingServiceImpl.java` | modificar | <método y regla> |
| api | `client-js/src/js/api.js` | modificar | `export async function <x>(...)` |
| store | `client-js/src/js/store.js` | modificar | <campo de estado> |
| components | `client-js/src/js/components/<X>.js` | crear | `X(contenedor, { onY })` -> `{ render(estado) }` |
| app | `client-js/src/js/app.js` | modificar | <qué conecta> |
| css | `client-js/src/css/main.css` | modificar | <clases, usando tokens de `designs/ui.md`> |

## Decisiones

### D1: <Tema>
- **Contexto**: <qué hay que decidir y por qué>
- **Opciones**: A) <...> B) <...>
- **Elegida**: <A> — **Por qué**: <razón y consecuencia aceptada>

## Pruebas

| Escenario del spec | Tipo | Archivo o qué observar |
| :--- | :--- | :--- |
| <HU-NN: escenario> | JUnit | `codigo_base/server/src/test/java/co/icesi/booking/server/<X>Test.java` |
| <HU-NN: escenario> | manual | <qué ver en dos ventanas del navegador> |

## Riesgos y pendientes

- <Riesgo o duda; vacío si no hay>
