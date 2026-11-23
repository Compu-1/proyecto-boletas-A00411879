#!/bin/bash
# Instala Icesi Live Arena en una VM Ubuntu (22.04 o superior). Se puede correr varias veces.
# Uso, dentro de la carpeta descomprimida del paquete: sudo ./install.sh
set -e

APP=icesi-live-arena
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -ne 0 ]; then
    echo "[ERROR] Ejecuta el instalador con sudo: sudo ./install.sh"
    exit 1
fi

# 1. Java 17 y Nginx, solo si faltan
if ! java -version 2>&1 | grep -qE 'version "(1[7-9]|2[0-9])'; then
    echo "[1/4] Instalando Java 17..."
    apt-get update -q
    if ! apt-cache show openjdk-17-jre-headless > /dev/null 2>&1; then
        echo "[ERROR] Este Ubuntu no ofrece openjdk-17-jre-headless; se necesita Ubuntu 22.04 o superior."
        exit 1
    fi
    apt-get install -y -q openjdk-17-jre-headless
else
    echo "[1/4] Java 17 ya está instalado."
fi
if ! command -v nginx > /dev/null; then
    echo "[1/4] Instalando Nginx..."
    apt-get update -q
    apt-get install -y -q nginx
else
    echo "[1/4] Nginx ya está instalado."
fi

# 2. Archivos: el jar en /opt y el frontend compilado en /var/www
echo "[2/4] Copiando el servidor y la taquilla..."
install -D -m 644 "$HERE/server.jar" "/opt/$APP/server.jar"
rm -rf "/var/www/$APP"
mkdir -p "/var/www/$APP"
cp -R "$HERE/dist/." "/var/www/$APP/"

# 3. Nginx: activar el sitio, quitar el de bienvenida, validar y recargar (Sesión 12)
echo "[3/4] Configurando Nginx..."
cp "$HERE/$APP.conf" "/etc/nginx/sites-available/$APP.conf"
ln -sf "/etc/nginx/sites-available/$APP.conf" "/etc/nginx/sites-enabled/$APP.conf"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# 4. Servidor Java como servicio: arranca con la VM y se reinicia si cae
echo "[4/4] Activando el servicio $APP..."
cp "$HERE/$APP.service" "/etc/systemd/system/$APP.service"
systemctl daemon-reload
systemctl enable "$APP"
systemctl restart "$APP"
sleep 3
systemctl is-active --quiet "$APP" || { echo "[ERROR] El servicio no arrancó: journalctl -u $APP"; exit 1; }

IP="$(hostname -I | awk '{print $1}')"
echo "--------------------------------------------------------------------------"
echo "[OK] Taquilla disponible en: http://$IP"
echo "[OK] Hora de la VM: $(date '+%Y-%m-%d %H:%M:%S %Z') (compárala con la del equipo, D-031)"
echo "[INFO] Logs del servidor: journalctl -u $APP -f"
