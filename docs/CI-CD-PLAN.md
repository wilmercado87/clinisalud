---
name: ci-cd
description: Plan CI/CD para CLINISALUD — CI automático en push/PR (compilación, tests, gates y agente de revisión opencode) + CD manual solo por tag de versión vX.Y.Z (sync BD Neon no destructivo + deploy Render + smoke test)
---

# CLINISALUD CI/CD - Plan de Implementación (v2, especializado en CI+CD)

## Objetivo

- **CI**: cada push/PR a `main` → compila, corre pruebas unitarias, gates de calidad y revisión de código (clean code + spec).
- **CD**: **solo** cuando se crea un **tag de versión** (`git tag vX.Y.Z`) → sincroniza el esquema de BD (Neon) con los modelos, despliega API + Frontend en Render y valida salud real (health + login + búsqueda).

## Decisiones tomadas (no re-preguntar)

| Decisión | Valor |
|---|---|
| CI trigger | `push` + `pull_request` a `main` |
| CD trigger | `push` de tag `v*` (ej. `v1.0.0`). Sin tag → NO hay deploy |
| Hosting | Render (Web Service `clinisalud-api` + Static Site `clinisalud-frontend`) |
| BD | Neon PostgreSQL serverless (SSL, `sslmode=require`) |
| Sincronización de esquema | `npm run db:alter` = `sequelize.sync({ alter: { drop: false } })` — crea tablas/columnas faltantes, **jamás dropea** datos |
| Verificación de esquema | `pg_dump --schema-only` de la BD real vs `backend/db/clinisalud.sql`; si difieren **el CD falla** (el dev regenera con `npm run db:schema` y commitea) |
| Rollback | Render → Deploys → **Promote** un deploy anterior |
| Revisión de código | Agente opencode CLI en CI (opcional, requiere `OPENCODE_API_KEY`) + gates determinísticos sin LLM |

---

## Diagrama del pipeline

```
push / PR a main
   │
   ▼
jobs ci.yml
   ├────────── backend-ci   (npm ci, tsc, jest 133, build)
   ├────────── frontend-ci  (npm ci, tsc, ng build --configuration production)
   ├────────── quality-gates (gates sin LLM: any ∄, @spec:INV-…; node scripts/quality-gates.mjs)
   └────────── code-review (SÓLO PR y si hay OPENCODE_API_KEY; comment en PR)

git tag vX.Y.Z + push
   │
   ▼
jobs cd.yml
   ├── db-sync            (npm run db:alter → Neon; pg_dump vs db/clinisalud.sql; diff≠0 → FAIL)
   ├── deploy-api         (← db-sync OK)  → POST Render /deploys api + esperar /health "healthy"
   ├── deploy-frontend    (← deploy-api)  → POST Render /deploys front → esperar HTTP 200
   └── smoke              (← ambos)        → login admin + búsqueda CUPS → ✓ o FAIL
```

---

## Fase 1 — CI (`.github/workflows/ci.yml`)

### Jobs

| Job | Pasos | Falla |
|---|---|---|
| `backend-ci` | `npm ci` → `npx tsc --noEmit` → `npm test` (jest, 133 tests) → `npm run build` | Cualquiera |
| `frontend-ci` | `npm ci` → `npx tsc --noEmit -p tsconfig.app.json` → `ng build --configuration production` | Cualquiera |
| `quality-gates` | `node scripts/quality-gates.mjs`: prohíbe `any` explícito nuevo en `backend/src` y `frontend/src`; advierte si tests modificados no citan `@spec:INV-...` | `any` nuevo (los avisos no bloquean) |
| `code-review` | Solo `pull_request` y si `OPENCODE_API_KEY_SET=true`. Instalación `opencode-ai` (npm), ejecuta `opencode run` con las skills del proyecto (clinisalud-simple, angular-architect, spec core, convención API) sobre el diff y comenta `🤖 Revisión opencode` en el PR | No bloquea (es consultivo). Dormido si no hay key |

### Secretos de CI

| Secret | Para qué | Status |
|---|---|---|
| `OPENCODE_API_KEY` | Agente de revisión (job `code-review`) | ⏳ **PENDIENTE** — sin provider hoy; job dormido. Variable `OPENCODE_API_KEY_SET=false` controla el interruptor |
| — | Gates sin LLM | No requiere secrets |

### Activar el agente cuando tengas API key (Gemini/OpenRouter/Anthropic gratis)

```bash
gh secret set OPENCODE_API_KEY --body "tu-key"
gh variable set OPENCODE_API_KEY_SET --body "true"
```

El job usa el modelo `gpt-4o-mini` en `code-review` (rendimiento/precio) — cámbialo en línea 69 de `ci.yml` si tu provider es otro (ej. `google/gemini-2.0-flash`, `openai/gpt-4o-mini`, `anthropic/claude-3-5-sonnet`).

---

## Fase 2 — CD (`clinisalud/.github/workflows/cd.yml`)

### Trigger

```bash
git tag v1.2.3 && git push origin v1.2.3
```

> Un tag en cualquier commit de main. `workflow_dispatch` NO existe en CD a propósito: solo tags.

### Jobs (en cadena)

| Job | Qué hace | Si falla |
|---|---|---|
| `db-sync` | `npm ci` → `npm run db:alter` (no destructivo) → `pg_dump --schema-only` (contenedor `postgres:18-alpine`) de Neon vs `backend/db/clinisalud.sql` (filtro: comentarios/`restrict`/`transaction_timeout`/`CREATE SCHEMA public`/vacías) | STOP: no deploy. Dif → ejecutar `npm run db:schema`, committear, tag nuevo |
| `deploy-api` | `POST https://api.staff.com/v1/services/<ID-api>/deploys` (branch main) → poll `/health` hasta `"healthy"` (máx 12 min) | Detiene el resto |
| `deploy-frontend` | `POST .../deploys` front → poll 200 (máx 12 min) | Detiene el resto |
| `smoke` | Login real `SMOKE_EMAIL/SMOKE_PASSWORD` + JWT + búsqueda CUPS (total ≥ 0) | Fracaso = versión producida sospechosa (puede haber sido desplegado) |

### Tabla de secrets de CD (ya configurada via `gh secret set`)

| Secret | Valor (dónde) | Estado |
|---|---|---|
| `DATABASE_URL` | Neon `postgresql://neondb_owner:****@ep-cool-field-.../neondb?sslmode=require` | ✅ seteado |
| `RENDER_API_KEY` | Render (workspace teaser) `rnd_P909...` | ✅ seteado |
| `SMOKE_EMAIL` | `admin@clinisalud.com` | ✅ seteado |
| `SMOKE_PASSWORD` | `Admin2026!` | ✅ seteado |

### ID de servicios Render (hardcodeados en `cd.yml`)

| Servicio | ID |
|---|---|
| API | `srv-d9rb73navr4c738rgid0` |
| Frontend | `srv-d9rj15afngtc73dg22n0` |

---

## Fase 3 — Sincronización de base de datos (el corazón del CD)

### Cómo funciona `db:alter` (backend)

```bash
cd backend && npm run db:alter   # usa DATABASE_URL
```

- Conecta a la BD.
- Por cada tabla, si **la tabla no existe** → la crea con `model.sync()`.
- Si existe → compara **columnas reales vs modelo**:
  - Columna faltante → se agrega **siempre nullable** con `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`; si el modelo define `defaultValue`, hace backfill de las filas existentes.
  - Columna `NOT NULL` según modelo pero nullable en BD → aplica `SET NOT NULL` solo cuando ya **no quedan NULLs**; si quedan, advierte y pide correr `npm run db:migrate`.
- **Nunca** borra tablas, columnas, índices ni datos (`drop: false`).
- Si algo falla → `process.exit(1)` → CD se detiene.

### Migraciones de datos (`npm run db:migrate`)

`src/scripts/db-migrate-data.ts` contiene migraciones de **datos** idempotentes (complementan `db:alter`, que solo toca esquema). Ejemplo vigente: sincronizar `tipo_autorizacion` desde su CSV canónico (upsert por PK). Para agregar una nueva corrección de datos se añade al arreglo `DATA_MIGRATIONS` (orden fijo, siempre idempotente).

### Flujo completo de release con cambios de esquema/datos

```bash
cd backend
npm run db:alter      # pasada 1: agrega columnas (nullable)
npm run db:migrate    # backfills de datos definidos en db-migrate-data.ts
npm run db:alter      # pasada 2: enforcing NOT NULL cuando ya no hay NULLs
npm run db:schema     # regenerar dump canónico y committearlo
```

### Flujo de cambio de esquema (para desarrolladores)

1. Modifica/agrega un modelo en `backend/src/models/*.ts`.
2. Local: `npm run db:alter && npm run db:migrate && npm run db:alter` (aplica a tu BD o `DATABASE_URL` local) y luego `npm run db:schema` → regenera `backend/db/clinisalud.sql`.
3. Commitea el cambio + el dump actualizado (CI lo valida).
4. Creamos tag → el CD hace `db:alter → db:migrate → db:alter` sobre Neon y después despliega la API nueva.

> Si olvidaste el paso 2, el job `db-sync` del CD **falla con el diff exacto** — nunca despliegas con esquema dividido.

### Casos límite conocidos
- `Db: alter` no crea foreign keys nuevas si la tabla ya existe (solo columnas). Para FKs nuevas: re-ejecutar migration manual o recrear tabla (migración abierta).
- Índices únicos con nombre muy largo (≥63 chars) que PG trunca: Sequelize puede intentar crearlos → error `relation ... already exists`. Fix: nombre corto en el modelo (ej. `name: "ux_usuario_opcion"`).
- `alter` no re-sincroniza tipos ya existentes (solo agrega columnas faltantes). Cambios de tipo se hacen con `npm run db:schema` manual.

---

## Fase 4 — Rutina de release (rebuild → tag)

```bash
# 1. Trabajo limpio en main
git checkout main && git pull origin main

# 2. (Desde este repo) validar local
cd backend && npm test && npm run build

# 3. Versión + tag (ej. v1.2.0)
git tag v1.2.0 -m "Release v1.2.0: <resumen>"
git push origin v1.2.0

# 4. Monitorear el CD
gh run list --workflow cd.yml   # o en Actions
```

Políticas de versión sugeridas:
- `v1.0.0` = primer release estable.
- `vX.Y.Z`: mayor/feature/patch según semver.
- Para corregir urgentemente: `git checkout v1.0.0 -b hotfix` → fix → `git tag v1.0.1` sobre el fix.

---

## Rollback (si algo se rompe en prod)

1. Render Dashboard → servicio afectado → **Deploys** → elegir el anterior a `Promote`.
2. Si el problema es esquema BD (sincronizado en `db-sync`) y el código viejo no soporta las columnas nuevas: **regenerar `db:clone` o ajustar** — el esquema es no destructivo, así que lo nuevo conserva columnas extras sin afectar dato; rollback de API es seguro.
3. Verificar con `curl https://clinisalud-api.onrender.com/health` y el smoke.

---

## Troubleshooting

| Problema | Causa probable | Solución |
|---|---|---|
| CI falla `tsc` | Tipo error en el diff | Corrige tipos, corre `npx tsc --noEmit` local |
| `db-sync` falla con diff | `db/clinisalud.sql` desactualizado | `cd backend && npm run db:schema && git commit` |
| `pg_dump: server version mismatch` | pg_dump del runner más viejo que Neon (PG 18) | El job ya usa `postgres:18-alpine` (Docker); no instalar cliente por apt (no existe en repos estándar) |
| `db:alter` error "relation ... already exists" | índice largo en modelo | Añade `name:` corto al índice del modelo, regenera schema |
| PG 23502 al agregar columna NOT NULL | tabla con filas existentes | Resuelto por diseño: `db-alter` agrega nullable → `db:migrate` hace backfill → segunda pasada aplica `SET NOT NULL`. Si advierte NULLs restantes, agrega la migración en `db-migrate-data.ts` |
| Deploy API no responde healthy | Render cold start lento o build error | Espera 12 min (lo hace el poll), revisa Logs de Render |
| `code-review` no corre | Sin `OPENCODE_API_KEY` / `OPENCODE_API_KEY_SET` | Mira la sección «Activar el agente» |
| Frontend 200 pero pantalla en blanco | Build viejo cacheado | Render → Deploy → Force build (o redeploy limpio) |

---

## Pendientes (fuera de este plan)

- **Plan de pruebas automatizadas (E2E Playwright + reportes)** → vivir en `docs/E2E-PLAN.md` (recreación futura, no mixtas con CI/CD).
- Monitoreo continuo `Fase 5` del plan original (métricas Render + uptime) — igual postergado.

---

## Checkbox final

- [x] `ci.yml` con backend-ci/frontend-ci/quality-gates/code-review
- [x] `render` 2 services con `autoDeploy=no`
- [x] `DATABASE_URL`, `RENDER_API_KEY`, `SMOKE_EMAIL/PASSWORD` en GitHub Secrets
- [x] `db:alter` no destructivo + `db-verify` bloqueante
- [x] Validación: push → CI verde + tag `v1.2.0` → CD completo + smoke
- [ ] `OPENCODE_API_KEY` + variable activadora (cuando el usuario tenga proveedor)