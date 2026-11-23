# Banco de preguntas (c-clarify)

Detonadores para el escaneo. Elegir lo que aplique y reescribir con datos del spec; no copiar tal cual.

## 1. Categorías

| Categoría | Qué buscar | Preguntas modelo |
| :--- | :--- | :--- |
| Competencia entre compradores | Dos compradores sobre la misma silla; quién gana | ¿Qué ve el comprador que pierde? ¿Se le sugiere otra silla? |
| Tiempos y límites | Retención, renovación, máximo de sillas | ¿Volver a elegir una silla propia reinicia los 90 s? ¿Cuántas sillas puede retener un comprador? |
| Expiración | Retención que vence en medio del pago | ¿Qué observa si paga con 0 s restantes? ¿Se quita sola del carrito? |
| Validaciones y errores | Nombre, correo, carrito vacío | ¿Qué formato de correo es válido? ¿Qué mensaje exacto se muestra? |
| Conexión | Servidor caído o reiniciado | ¿Qué ve el comprador sin conexión? ¿Qué pasa con su carrito? |
| Estados vacíos y bordes | Primer uso, evento agotado, sin compras | ¿Qué ve si no quedan sillas? ¿Y si no tiene compras? |
| Ciclo de vida | Compra confirmada, reinicio del inventario | ¿Una compra se puede cancelar? ¿Qué pasa con las compras si se reinicia el inventario? |
| Datos personales | Nombre y correo del comprador | ¿Quién más puede ver esos datos? |
| Relación con otras HU | Solapamiento con `epics.md` | ¿Reemplaza o complementa HU-NN? ¿Depende de una HU no hecha? |
| Lenguaje vago | "tiempo real", "rápido" | ¿Cada cuántos segundos debe verse el cambio de otro comprador? |
| Terminología | "bloquear" / "retener" / "reservar" | ¿Cuál término se muestra al comprador? |

## 2. Funcionalidades implícitas (control de alcance)

Por cada una que el spec sugiera sin mencionarla, preguntar si entra ahora (recomendada: **No incluir ahora**):

- Cancelar o reembolsar una compra.
- Filtrar el mapa por zona o precio.
- Elegir varias sillas contiguas de un solo clic.
- Enviar el comprobante por correo o descargarlo.
- Cuenta de usuario o inicio de sesión.
- Persistir compras tras reiniciar el servidor.
- Varios eventos.
- Uso sin conexión.

Cierre por HU: ¿qué pasa si no se construye? ¿Sigue siendo P1? ¿Qué **no** debe hacer?

## 3. Anatomía de una pregunta

Contexto con referencia → una decisión → 2 a 4 opciones (recomendada primero, con razón) → consecuencia de no decidir.

> **P1 · HU-02, RN-01**: el spec dice que la retención dura 90 s, pero no qué pasa si el comprador vuelve a elegir una silla que ya tiene.
> - **A (recomendada)**: el tiempo se reinicia a 90 s. Es lo que el enunciado describe como renovación.
> - **B**: no pasa nada; el tiempo sigue corriendo.
> - **C**: la silla se quita del carrito.
>
> *Si no se define*: el comportamiento se decidiría al programar.

No se pregunta: "¿Usamos polling o callbacks?" (CÓMO), "¿Algo más?" (sin decisión), "¿Debe ser rápido?" (vago).

## 4. Registro en el spec

Agregar al final y cambiar `Estado` a `Aclarado`:

````markdown
## 7. Aclaraciones

### Sesión AAAA-MM-DD

- **P1** (HU-02, RN-01) ¿Re-elegir una silla propia reinicia el tiempo? → **R**: A → Aplicado en: RN-02, HU-02 escenario "Renovar retención".

### Cobertura

| Categoría | Resultado |
| :--- | :--- |
| Competencia entre compradores | Sin hallazgos |
| Tiempos y límites | Resuelto (P1) |
| Funcionalidades implícitas | Asumidas fuera de alcance |
````
