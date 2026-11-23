# Especificación: Despliegue en una VM de la sala

- **Slug**: despliegue-vm · **Rama**: `feature/despliegue-vm`
- **Fecha**: 2026-11-23
- **Estado**: Aprobado
- **RF/RNF**: RF-1 a RF-7 (en la VM), RNF-1, RNF-4; bonificación "Despliegue en una VM de la sala" (+10 %)
- **Requerimiento original**:
  > dejar listo el despliegue en una VM de la sala (jar ejecutable con Ice, dist/ con Nginx y proxy del WebSocket por el puerto 80, servicio systemd, install.sh, pasos en README), probado localmente en Docker con Ubuntu; supuestos: Ubuntu, una sola VM, sudo.

## 1. Contexto y objetivo

Hoy la taquilla solo funciona en el computador de desarrollo. Objetivo: que cualquier Comprador en la sala la use desde su navegador con solo la dirección de la VM, con el mismo comportamiento que en local, y que siga disponible aunque la VM se reinicie. Como no hay acceso a la VM desde casa, todo se deja listo y probado en una VM simulada; en la sala solo se instala con el procedimiento documentado.

## 2. Historias de usuario

### HU-14: Usar la taquilla desde otro equipo de la sala (Prioridad: P1) · RF-1 a RF-7, RNF-1, RNF-4

Como Comprador quiero abrir la taquilla desde mi equipo escribiendo la dirección de la VM para reservar sin instalar nada.

```gherkin
# language: es
Característica: Usar la taquilla desde otro equipo de la sala

  Antecedentes:
    Dado que la taquilla está instalada en la VM con la dirección "10.147.17.50"

  Escenario: Abrir la taquilla con solo la dirección de la VM
    Cuando el Comprador abre "http://10.147.17.50" en su navegador
    Entonces ve el evento, los precios por zona y el plano de 90 sillas con su estado

  Escenario: Dos equipos ven los cambios del otro
    Dado que el Comprador A y el Comprador B tienen la taquilla abierta en equipos distintos
    Cuando el Comprador A retiene "A-1"
    Entonces el Comprador B ve "A-1" como retenida en máximo 2 s

  Escenario: Flujo completo de compra
    Dado que el Comprador retuvo "A-1" y "F-3"
    Cuando paga como "Ana Pérez" con el correo "ana@correo.com"
    Entonces ve su comprobante con un código "RES-" seguido de 8 caracteres y el total "$165.000"

  Escenario: La cuenta regresiva coincide con la de local
    Dado que el reloj de la VM y el del equipo del Comprador difieren en menos de 2 s
    Cuando el Comprador retiene "B-4"
    Entonces ve "B-4" en su carrito con entre 88 y 90 s restantes
    Y a los 90 s "B-4" vuelve a estar disponible para todos

  Escenario: La taquilla de la VM deja de responder
    Dado que el Comprador tiene la taquilla abierta
    Cuando la taquilla de la VM deja de atender
    Entonces ve el aviso de sin conexión, igual que en local
```

### HU-15: Encontrar la taquilla disponible aunque la VM se reinicie (Prioridad: P2) · RF-1, RF-7

Como Comprador quiero que la taquilla vuelva a atender sola tras un reinicio de la VM para no depender de que alguien la arranque a mano.

```gherkin
# language: es
Característica: Encontrar la taquilla disponible aunque la VM se reinicie

  Escenario: Reinicio de la VM
    Dado que la taquilla está instalada en la VM
    Cuando la VM se reinicia
    Entonces en máximo 60 s desde que la VM vuelve a encender el Comprador abre la taquilla y ve el plano de 90 sillas

  Escenario: La taquilla se cae sola
    Dado que la taquilla de la VM se detuvo por un fallo
    Cuando pasan 10 s
    Entonces el Comprador recarga la página y vuelve a ver el plano

  Escenario: Tras reiniciar, las sillas vuelven a estar disponibles
    Dado que antes del reinicio "A-1" estaba vendida
    Cuando la taquilla vuelve a atender
    Entonces el Comprador ve las 90 sillas disponibles
```

## 3. Reglas de negocio

- **RN-01**: El Comprador solo escribe la dirección de la VM, sin números adicionales ni rutas; cualquier ruta inexistente muestra la taquilla.
- **RN-02**: En la VM se comporta igual que en local: mismos mensajes, tiempos (retención de 90 s, cambios visibles en máximo 2 s) y reglas de compra.
- **RN-03**: La instalación en una VM Ubuntu limpia se hace con un único procedimiento documentado de máximo 5 comandos, con conexión a internet en la VM.
- **RN-04**: Solo se publica lo necesario para usar la taquilla: nunca el código fuente sin empaquetar ni las dependencias de desarrollo.

## 4. Fuera de alcance

- Desplegar en la VM real desde casa (no hay acceso); se hace en la sala con RN-03.
- Dominio propio, HTTPS o certificados.
- Conservar sillas vendidas o compras tras un reinicio (el estado vive en memoria; riesgo aceptado).
- Varias VM o balanceo de carga.

## 5. Supuestos y preguntas abiertas

- **Supuesto**: una sola VM Ubuntu con `sudo` e internet; la dirección "10.147.17.50" es de ejemplo.
- **Supuesto**: la verificación se hace en una VM simulada en el Mac; en la sala se repite el escenario "Dos equipos ven los cambios del otro" con dos equipos reales.
- **Supuesto**: tras un reinicio, "Mis compras" del navegador puede listar compras que la taquilla ya olvidó; se acepta igual que el resto del estado en memoria.

## 6. Notas para el diseño (no vinculantes)

- Usuario: "jar ejecutable con Ice, dist/ con Nginx y proxy del WebSocket por el puerto 80, servicio systemd, install.sh, pasos en README", "probado localmente en Docker con Ubuntu".
- Enunciado: canal WebSocket `ws://localhost:10002`; el navegador habla solo por WebSocket. Opción a decidir en `c-plan`: WebSocket directo al 10002 (más literal, exige que el firewall lo abra) o `proxy_pass` de Nginx en el 80 (no depende del firewall). `api.js` ya usa `window.location.hostname`.
- D-031: la cuenta regresiva usa el reloj del navegador; comparar `date` de la VM con el equipo al desplegar.
- `conventions/frontend.md` §5 y apuntes Sesión 12: `/var/www/<app>/`, `try_files`, `gzip`, `nginx -t` antes de `systemctl reload nginx`.
