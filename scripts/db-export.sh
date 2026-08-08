#!/usr/bin/env bash
set -euo pipefail

# CLINISALUD - Exportar BD local hacia dump portable (para migrar a la VM)
# Uso: bash scripts/db-export.sh [archivo.sql]
# Ejemplo import en VM: docker compose exec -T db psql -U clinisalud -d clinisalud < clinisalud_full_dump.sql

OUT="${1:-clinisalud_full_dump.sql}"
DATABASE_URL="${DATABASE_URL:-postgresql://clinisalud:clinisalud@localhost:5432/clinisalud}"

echo "==> Exportando $DATABASE_URL -> $OUT"
pg_dump "$DATABASE_URL" --no-owner --no-acl > "$OUT"
echo "==> OK: $(wc -l < "$OUT") lineas"
echo "Siguiente paso en la VM:"
echo "  docker compose exec -T db psql -U clinisalud -d clinisalud < $OUT"