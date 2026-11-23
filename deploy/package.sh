#!/bin/bash
# Arma en el Mac el paquete para la VM (D-047): deploy/build/icesi-live-arena.tar.gz
# Uso (desde cualquier carpeta): ./deploy/package.sh
set -e -o pipefail

DEPLOY_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$DEPLOY_DIR")"
STAGE="$DEPLOY_DIR/build/icesi-live-arena"

# Gradle 8.6 necesita JDK 17 (conventions/stack.md)
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
export ICE_HOME=/opt/homebrew

echo "[1/3] Compilando el jar del servidor..."
(cd "$ROOT_DIR/codigo_base" && ./gradlew :server:jar -q)

echo "[2/3] Compilando el frontend (dist/)..."
(cd "$ROOT_DIR/client-js" && npm run build --silent | grep -E "compiled|ERROR")

echo "[3/3] Armando el paquete..."
rm -rf "$DEPLOY_DIR/build"
mkdir -p "$STAGE"
cp "$ROOT_DIR/codigo_base/server/build/libs/server.jar" "$STAGE/"
cp -R "$ROOT_DIR/client-js/dist" "$STAGE/dist"
cp "$DEPLOY_DIR/install.sh" "$DEPLOY_DIR/icesi-live-arena.conf" "$DEPLOY_DIR/icesi-live-arena.service" "$STAGE/"
# COPYFILE_DISABLE y --no-xattrs evitan que el tar de macOS agregue sus metadatos (._* y avisos en Ubuntu)
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$DEPLOY_DIR/build/icesi-live-arena.tar.gz" -C "$DEPLOY_DIR/build" icesi-live-arena

echo "[OK] Paquete listo: $DEPLOY_DIR/build/icesi-live-arena.tar.gz"
