---
name: ci-cd
description: Plan CI/CD profesional multi-agente para CLINISALUD - Docker, GitHub Actions, agentes de revisión con skills, E2E Playwright y monitoreo en Render (Free) + Neon (Postgres Free)
---

# CLINISALUD CI/CD - Plan de Implementación

## Contexto

Automatizar el pipeline del proyecto (Angular 19 standalone + Express/Sequelize/PostgreSQL + Socket.io) con:

- **CI automático**: compilación, calidad de código y pruebas en cada push/PR a `main`.
- **Agentes de revisión** (opencode CLI en CI): revisan código contra las skills del stack y las reglas de negocio del proyecto.
- **CD**: auto-deploy desde `main` vía Render (Web Service + Static Site), sin tarjeta de crédito.
- **E2E Playwright** + **monitoreo** (pendiente, sección Fase 4/5).

## Decisiones tomadas (no re-preguntar)

| Decisión | Valor |
|---|---|
| Hosting | **Render Free** (Web Service backend + Static Site frontend) — sin tarjeta, auto-deploy desde `main` |
| Base de datos | **Neon Free** (PostgreSQL serverless, 0.5GB, scale-to-zero) — sin tarjeta, sin expiración |
| Descartado | Oracle Cloud Free VM (exige tarjeta de crédito), Railway/Fly.io (tarjeta), Koyeb (dudoso) |
| Agentes de revisión | opencode CLI dentro de GitHub Actions (usa las skills directamente) — pendiente |
| E2E + monitoreo | Playwright (on-demand + nightly) + métricas de Render/Neon — pendiente |
| Rollback | Re-deploy de un commit anterior en Render (Deploys → Promote) |

## Estado actual (2026-08-08) — ✅ PRODUCCIÓN DESPLEGADA

| Componente | URL | Estado |
|---|---|---|
| Frontend (Angular 19) | https://clinisalud-frontend.onrender.com | ✅ live |
| Backend (Express/Docker) | https://clinisalud-api.onrender.com | ✅ live, `/health` healthy |
| BD PostgreSQL | Neon (`ep-cool-field-ax9397a5...`) | ✅ 41 tablas, 21.426 cups migrados |

Validado en prod: login admin 200 + JWT, búsqueda cups 200 (0.76s), migración completa desde local con `pg_dump`.

## Hallazgos críticos del repo (resueltos)

1. ~~PAT expuesto en remote~~ → ✅ remote limpio (`https://github.com/wilmercado87/clinisalud.git`); git local usa keychain `wilmercado87` + `gh` CLI (scopes repo/workflow/write:packages). NO tocar la credencial `215178476` (exwmerc_bci).
2. ~~`sequelize.sync({force:true})` en cada boot~~ → ✅ gate `DB_SYNC=force` (solo explícito); default no destructivo (`backend/src/index.ts:21`).
3. ~~Frontend sin env prod~~ → ✅ `environment.prod.ts` con `apiUrl` absoluto de Render + `fileReplacements` en `angular.json`.
4. ~~SQLite~~ → ✅ **PostgreSQL** (`DATABASE_URL`); en prod: **Neon** con SSL (`dialectOptions.ssl` auto en `database.ts`, solo fuera de localhost).
5. Socket.io → ✅ el frontend conecta a la origin del API (Render expone WebSockets directo, sin proxy Nginx necesario).
6. Tests: backend jest **111/111** ✅; frontend karma (pendiente ChromeHeadless en CI).
7. Sin lint → gates determinísticos propios (pendiente, Fase 2).
8. `.nvmrc` = v20.

## Arquitectura de despliegue (actual)

```
main ──► GitHub (push)
         ├─► Render Web Service "clinisalud-api"  (backend/Dockerfile, plan free, /health)
         │     env: DATABASE_URL→Neon, JWT_SECRET, DB_SYNC=normal, PORT=3000
         └─► Render Static Site "clinisalud-frontend" (ng build production → dist/frontend/browser)
                 │
                 ▼
         Neon Postgres (serverless, scale-to-zero)
```

- Deploy automático en cada push a `main` (Render auto-deploy).
- `render.yaml` blueprint versionado en la raíz (los servicios ya existen vía API; el blueprint queda como declaración).
- Migración de datos: `scripts/db-export.sh` (pg_dump local → psql destino).

## Límites conocidos del free tier

- **Render free**: apps duermen tras ~15 min sin tráfico; cold start 30–60s. 750h/mes, 512MB RAM. Solo 1 servicio Postgres free propio (no usado — usamos Neon).
- **Neon free**: 0.5GB, 100 CU-h/mes (~3h/día activo), scale-to-zero, sin expiración.
- BD actual: ~51MB → cabe con holgura.

---

## Fase 0 — Seguridad y preparación ✅ COMPLETADA

1. ✅ Remote sin PAT; auth local vía keychain `wilmercado87` + `gh` (no tocar exwmerc_bci).
2. ✅ Gate `DB_SYNC=force` implementado (no destructivo en prod).
3. ✅ `environment.prod.ts` + `fileReplacements`.
4. ✅ `.env.example` actualizado a PostgreSQL; `database.ts` con SSL condicional (Neon).

## Fase 1 — Docker (local) ✅ COMPLETADA

5. ✅ `backend/Dockerfile` multi-stage (node:20-alpine; `npm ci` → `tsc` → runtime solo prod deps). Fix: `csv-parser` movido a `dependencies` (lo usa `seed.ts` en runtime); `openapi-types` agregado al lock.
6. ✅ `frontend/Dockerfile` multi-stage (`ng build --configuration production` → nginx:alpine).
7. ✅ `frontend/nginx.conf` (proxy `/api/` y `/socket.io/` con Upgrade) — **usado solo local/compose**; en Render no aplica (static + API separados).
8. ✅ `docker-compose.yml` (db postgres:16 + backend + frontend + healthchecks) — **para local/validación**.
9. ✅ `.dockerignore` en backend y frontend.
10. ✅ Verificación local completa con Colima (Docker 29, Compose v2): health + login + cups + socket.io 200.

## Fase 2 — CI automático (`.github/workflows/ci.yml`) ⏳ PENDIENTE

11. Triggers: `push` a main + `pull_request`.
12. Job `build-test` (ubuntu-latest, node 20, caché npm):
    - Backend: `npm ci`, `npx tsc --noEmit`, `npm test` (jest 111).
    - Frontend: `npm ci`, `npx tsc --noEmit -p tsconfig.app.json`, `ng build --configuration production`, karma con ChromeHeadless (instalar `google-chrome-stable`).
13. Job `quality-gates` determinístico (`scripts/quality-gates.mjs`): prohibir `any` nuevo, trazabilidad `@spec:INV-...`, convenciones CONVENCION-API.md.
14. Job `review-agents` (solo PR, `dorny/paths-filter`):
    - Instalar opencode: `npm i -g opencode-ai`.
    - **A1**: `opencode run` con `.opencode/skills/clinisalud-simple/SKILL.md` + `.opencode/skills/angular-architect/SKILL.md` → JSON → comentario en PR.
    - **A2**: `opencode run` con `docs/spec/CLINISALUD-SPEC-CORE.md` + `docs/CONVENCION-API.md` → invariantes/trazabilidad/nomenclatura → comentario en PR.
    - Permissions: `pull-requests: write`. Requiere secret API key LLM.

## Fase 3 — CD ✅ COMPLETADA (Render auto-deploy; se eliminó el plan VM/GHCR)

15. ✅ Servicios creados vía Render API (formato `servicePOST` con `type: web_service|static_site`, `serviceDetails.{runtime,plan,healthCheckPath}`).
16. ✅ Env vars: `DATABASE_URL` (Neon), `JWT_SECRET`, `NODE_ENV`, `PORT`, `DB_SYNC=normal`.
17. ✅ Healthcheck `/health` (ya existía en `app.ts:24`).
18. ✅ Migración de datos: `pg_dump` local → `psql` a Neon (41 tablas, cups, articulados, admin).
19. Rollback: Render → Deploys → Promote commit anterior.
- ~~vm-setup.sh / cd.yml GHCR+SSH~~ → eliminados (obsoletos con Render).

## Fase 4 — E2E Playwright (`.github/workflows/e2e.yml`) ⏳ PENDIENTE

20. Proyecto `e2e/` con `@playwright/test` contra `https://clinisalud-frontend.onrender.com`:
    - Auth: login exitoso, inválido, logout.
    - Gestor usuarios: crear usuario, toggle estado, editar permisos.
    - Perfil: actualizar datos/email, cambio de contraseña + relogin.
    - Admisiones: crear admisión (paciente nuevo/existente), validar cama ocupada.
21. Config: `playwright.config.ts` con `E2E_BASE_URL`, workers paralelos, reporte HTML + JUnit.
22. Triggers: `workflow_dispatch` + `schedule` nightly; `opencode run` analizando fallos → artifact/issue.

## Fase 5 — Monitoreo ⏳ PENDIENTE (adaptado a Render/Neon, sin VM)

23. En vez de Prometheus/Grafana en VM: métricas nativas Render (CPU/RAM en dashboard), Neon (uso/compute), `GET /health` como probe periódico (UptimeRobot free o workflow GH nightly).
24. `.github/workflows/perf-report.yml` (workflow_dispatch + nightly): curl `/health` + latencia p95, reporte de estabilidad → artifact/issue.
25. Umbrales: p95 < 500ms, 5xx < 1%.

## Fase 6 — Verificación y documentación ✅ PARCIAL

26. ✅ `render.yaml` blueprint + esta guía; `scripts/db-export.sh`.
27. ✅ Verificación prod: health, login, cups search (0.76s), frontend 200.
- ⏳ `CI-CD.md` final con diagrama/troubleshooting + PR de ejemplo con agentes.

## Checklist de ejecución

- [x] Fase 0: PAT local seguro, gate DB_SYNC, environment.prod.ts, .env.example PG
- [x] Fase 1: Dockerfiles + compose + nginx + health + dockerignore + validación Colima
- [ ] Fase 2: ci.yml con build-test + quality-gates + review-agents (A1/A2)
- [x] Fase 3: deploy Render+Neon (auto-deploy desde main, rollback por Promote)
- [ ] Fase 4: e2e Playwright + e2e.yml (manual + nightly)
- [ ] Fase 5: monitoreo healthcheck + perf-report.yml
- [ ] Fase 6: CI-CD.md + PR de ejemplo con agentes

## Pedidos al usuario al inicio de la ejecución (restantes)

1. API key LLM (OpenAI/Anthropic/Gemini) como secret para los agentes A1/A2 (Fase 2).
2. Nada más: el deploy ya está vivo y no requiere credenciales adicionales.
