#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# CLINISALUD - Setup inicial de la VM (Oracle Cloud Free ARM)
# Uso: sudo bash scripts/vm-setup.sh [--with-tls dominio]
# Ejecutar UNA sola vez en la VM recién creada.
# ============================================================

GIT_REPO="https://github.com/wilmercado87/clinisalud.git"
APP_DIR="/opt/clinisalud"

echo "==> 1/8 Actualizando sistema"
apt-get update -y && apt-get upgrade -y

echo "==> 2/8 Instalando Docker + compose + git"
curl -fsSL https://get.docker.com | sh
apt-get install -y git

echo "==> 3/8 Habilitando Docker"
systemctl enable --now docker
usermod -aG docker "${SUDO_USER:-ubuntu}"

echo "==> 4/8 Firewall (22/80/443)"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
fi

echo "==> 5/8 Clonando repositorio"
git clone "$GIT_REPO" "$APP_DIR" || (cd "$APP_DIR" && git pull)

echo "==> 6/8 .env de producción"
if [ ! -f "$APP_DIR/.env" ]; then
  cat > "$APP_DIR/.env" <<'EOF'
POSTGRES_DB=clinisalud
POSTGRES_USER=clinisalud
POSTGRES_PASSWORD=cambiar_esta_clave
DB_SYNC=normal
JWT_SECRET=cambiar_este_secreto
EOF
  echo "Crea $APP_DIR/.env editado con claves fuertes (EJECUTADO: nano $APP_DIR/.env)"
fi

echo "==> 7/8 Login GHCR (para pull de imagenes privadas)"
echo "Autenticate con: echo <GIT_PAT> | docker login ghcr.io -u wilmercado87 --password-stdin"

echo "==> 8/8 Migracion de datos (opcional)"
echo "Si traes un dump: docker compose exec -T db psql -U clinisalud -d clinisalud < clinisalud_full_dump.sql"
echo "Sino, primera vez con seed: docker compose up -d --build y luego ejecutar DB_SYNC=force UNA vez."

echo
echo "LISTO. Siguiente paso:"
echo "  cd $APP_DIR && docker compose pull && docker compose up -d"
