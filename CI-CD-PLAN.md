---
name: ci-cd
description: Plan CI/CD profesional multi-agente para CLINISALUD - Docker, GitHub Actions, agentes de revisión con skills, E2E Playwright y monitoreo Prometheus/Grafana en Oracle Cloud Free VM
---

# CLINISALUD CI/CD - Plan de Implementación

## Contexto

Automatizar el pipeline del proyecto (Angular 19 standalone + Express/Sequelize/SQLite + Socket.io) con:

- **CI automático**: compilación, calidad de código y pruebas en cada push/PR a `main`.
- **Agentes de revisión** (opencode CLI en CI): revisan código contra las skills del stack y las reglas de negocio del proyecto.
- **CD controlado**: deploy manual versionado (`workflow_dispatch`), nunca automático, con rollback por tag.
- **E2E Playwright** + **monitoreo Prometheus/Grafana** en la VM.

## Decisiones tomadas (no re-preguntar)

| Decisión | Valor |
|---|---|
| Hosting | Oracle Cloud Free VM (ARM, 4 OCPU/24GB/200GB) - único free tier con disco persistente para SQLite |
| Agentes de revisión | opencode CLI dentro de GitHub Actions (usa las skills directamente) |
| E2E + monitoreo | Playwright (on-demand + nightly) + Prometheus/Grafana en la VM |
| Despliegue | Docker Compose en VM Oracle, imágenes en GHCR, tags `vX.Y.Z` |
| Rollback | Re-disparar deploy con el tag anterior |

## Hallazgos críticos del repo (ya identificados)

1. **PAT de GitHub expuesto** en el remote URL (`ghp_...@github.com/wilmercado87/clinisalud.git`) → rotar obligatorio, mover a secretos.
2. **`backend/src/index.ts` ejecuta `sequelize.sync({ force: true })` + seed en cada arranque** → borraría la BD en prod. Gatear con `SEED_DB=true`; en prod usar `sync()` no destructivo.
3. **Frontend sin `environment.prod.ts`** (solo `environment.ts` con `localhost:3000`) → crear con `apiUrl: '/api/v1'` + `fileReplacements` en `angular.json`.
4. **SQLite** (`./database.sqlite`, ruta relativa) → volumen persistente `/app/data` en el contenedor.
5. **Socket.io** → el proxy Nginx del frontend debe soportar `upgrade` de websockets para `/socket.io`.
6. **Tests**: backend jest (78 tests verdes, `AdmissionsService.test.ts` usa fecha dinámica), frontend karma (necesita ChromeHeadless en CI).
7. **Sin lint**: no existe script `lint` en frontend ni backend; gates determinísticos propios.
8. `.nvmrc` = v20.

## Prerequisitos (pedir al usuario)

- API key LLM para agentes (secret `OPENAI_API_KEY` o `ANTHROPIC_API_KEY`).
- Credenciales Oracle Cloud: host IP + par de claves SSH (secret `DEPLOY_HOST`, `DEPLOY_SSH_KEY`).
- PAT de GitHub nuevo (scope repo mínimo) como secret `GIT_PAT`.
- Secrets: `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `E2E_BASE_URL`.

## Advertencia de ancho de banda

La Fase 1 (docker build local) descarga ~1.5 GB; CI/CD corre en la nube (0 MB en el equipo del usuario). Verificación Docker local y Playwright local solo con wifi.

---

## Fase 0 — Seguridad y preparación

1. Rotar PAT: `git remote set-url origin https://github.com/wilmercado87/clinisalud.git` (sin token). Generar PAT nuevo y guardarlo como secret `GIT_PAT`.
2. Gatear el wipe+seed en `backend/src/index.ts`:
   - `SEED_DB=true` (por defecto en dev) → `sync({ force: true })` + seed.
   - En prod → `sequelize.sync()` (no destructivo) y seed solo si flag explícito.
3. Crear `frontend/src/environments/environment.prod.ts`:
   ```ts
   export const environment = { production: true, apiUrl: '/api/v1' };
   ```
   Agregar `fileReplacements` en `angular.json` (configurations.production).
4. Verificar/dar al usuario la lista de secrets de GitHub (sección Prerequisitos).

## Fase 1 — Docker (local)

5. `backend/Dockerfile` (multi-stage, node:20-alpine):
   - Stage build: `npm ci` → `npm run build` (tsc).
   - Stage runtime: copiar `dist`, `package*.json`, `node_modules` de producción; `WORKDIR /app`; volumen `/app/data`; `ENV DATABASE_PATH=/app/data/database.sqlite`; CMD `node dist/index.js`.
6. `frontend/Dockerfile` (multi-stage):
   - Stage build: node:20-alpine → `npm ci` → `ng build --configuration production`.
   - Stage runtime: `nginx:alpine`, copiar `dist/frontend/browser`, `nginx.conf`.
7. `frontend/nginx.conf`:
   - `location /api/` → proxy_pass backend:3000 (preservar path `/api/v1`).
   - `location /socket.io/` → proxy con `proxy_http_version 1.1`, headers `Upgrade`/`Connection`, `proxy_set_header X-Forwarded-*`.
   - SPA fallback `try_files $uri $uri/ /index.html;`, gzip.
8. `docker-compose.yml` (prod, para la VM): servicio `backend` (volumen `./data:/app/data`, `restart: unless-stopped`, env desde `.env`), servicio `frontend` (ports `80:80`). Healthcheck backend: agregar endpoint `GET /health` en `backend/src/app.ts` (o usar `node -e fetch`).
9. `.dockerignore` en `backend/` y `frontend/` (node_modules, dist, logs, *.sqlite).
10. Verificación local (con wifi): `docker compose build` + `docker compose up` + curl `/health`.

## Fase 2 — CI automático (`.github/workflows/ci.yml`)

11. Triggers: `push` a main + `pull_request`.
12. Job `build-test` (ubuntu-latest, node 20, caché npm):
    - Backend: `npm ci`, `npx tsc --noEmit`, `npm test` (jest).
    - Frontend: `npm ci`, `npx tsc --noEmit -p tsconfig.app.json`, `ng build --configuration production`, karma con ChromeHeadless (instalar `google-chrome-stable` o usar `karma-chrome-launcher` + CHROME_BIN).
    - Upload artifacts: coverage y dist.
13. Job `quality-gates` (determinístico, `scripts/quality-gates.mjs`):
    - Prohibir `any` nuevo en TS (grep diffs).
    - Trazabilidad SDD: tests citando `@spec:INV-...` (warning si falta).
    - Convenciones CONVENCION-API.md: rutas kebab-case plural, body camelCase.
14. Job `review-agents` (solo PR, skip si no cambia código con `dorny/paths-filter`):
    - Instalar opencode: `npm i -g opencode-ai`.
    - **A1**: `opencode run` con prompt que carga `.opencode/skills/clinisalud-simple/SKILL.md` + `.opencode/skills/angular-architect/SKILL.md` y revisa el diff → salida JSON → comentario en PR con `actions/github-script`.
    - **A2**: `opencode run` con `CLINISALUD-SPEC-CORE.md` + `backend/CONVENCION-API.md` → valida invariantes de negocio, trazabilidad y nomenclatura → comentario en PR.
    - Permissions: `pull-requests: write`.

## Fase 3 — CD controlado (`.github/workflows/cd.yml`)

15. Trigger: `workflow_dispatch` con input `version` (ej. `v1.2.0`). Nunca automático.
16. Job `build-push`: docker/build-push-action buildx → `ghcr.io/wilmercado87/clinisalud-backend:vX.Y.Z` y `...-frontend:vX.Y.Z` (secrets: GITHUB_TOKEN con packages: write).
17. Job `deploy` (needs build-push): SSH a VM (appleboy/ssh-action, `DEPLOY_HOST` + `DEPLOY_SSH_KEY`):
    - `docker compose pull` + `docker compose up -d` con el tag fijo.
    - Healthcheck: curl `/health`; si falla, log de diagnóstico.
18. Primer deploy (script `scripts/vm-setup.sh` en la VM, manual del usuario):
    - Instalar Docker + compose, usuario `deployer`, firewall (22/80/443), certbot TLS (opcional).
    - Migrar `backend/database.sqlite` actual al volumen `./data/` (o regenerar con `SEED_DB=true` solo la primera vez).
    - Clonar repo + `docker compose pull` con credenciales GHCR.
19. Rollback: re-disparar `cd.yml` con el tag anterior (documentado en `CI-CD.md`).

## Fase 4 — E2E Playwright (`.github/workflows/e2e.yml`)

20. Crear proyecto `e2e/` (o `frontend/e2e/`) con `@playwright/test`:
    - Auth: login exitoso, login inválido, logout.
    - Gestor usuarios: crear usuario (form + permisos), toggle estado, editar permisos.
    - Perfil: actualizar datos, actualizar email, cambio de contraseña + relogin.
    - Admisiones: crear admisión (paciente nuevo/existente), validar cama ocupada.
21. Config: `playwright.config.ts` con `E2E_BASE_URL` (secret/var), workers en paralelo, reporte HTML + JUnit.
22. Triggers: `workflow_dispatch` + `schedule` nightly. Job: deploy del último tag (reusar cd.yml o usar release a demanda), correr suite, subir artefacto de reporte, y `opencode run` analizando fallos → emitir diagnóstico (artifact o issue).

## Fase 5 — Monitoreo (`.github/workflows/perf-report.yml` + VM)

23. En la VM: `docker-compose.monitoring.yml`:
    - Prometheus + node-exporter + cAdvisor (scrape de contenedores).
    - Grafana con dashboards provisionados (CPU/RAM/disco/red/latencia) en `monitoring/grafana/provisioning/`.
    - (Opcional) Alertmanager con webhook/email.
24. `.github/workflows/perf-report.yml` (workflow_dispatch + nightly):
    - `opencode run` lee snapshot de métricas (curl a Prometheus vía SSH) y publica reporte de estabilidad, latencia, concurrencia y recomendaciones de optimización como artifact/issue.
25. Documentar umbrales sugeridos: p95 latencia < 500ms, uso CPU/RAM sostenido, tasa de errores 5xx < 1%.

## Fase 6 — Verificación y documentación

26. Crear `CI-CD.md` en la raíz: diagrama del pipeline, comandos de deploy/rollback, ejecución local de agentes, troubleshooting (karma en CI, websockets, SQLite permissions, GHCR auth).
27. Verificación final (con wifi):
    - `docker compose build && docker compose up` local + `/health`.
    - Suite completa local en verde.
    - PR de ejemplo con los dos agentes A1/A2 corriendo en CI.

## Checklist de ejecución

- [ ] Fase 0: PAT rotado, gate SEED_DB, environment.prod.ts, secrets documentados
- [ ] Fase 1: Dockerfiles + compose + nginx + health + dockerignore
- [ ] Fase 2: ci.yml con build-test + quality-gates + review-agents (A1/A2)
- [ ] Fase 3: cd.yml versionado + vm-setup.sh + migración BD + rollback documentado
- [ ] Fase 4: e2e Playwright + e2e.yml (manual + nightly)
- [ ] Fase 5: monitoring compose + perf-report.yml
- [ ] Fase 6: CI-CD.md + verificación local + PR de ejemplo

## Pedidos al usuario al inicio de la ejecución

1. Rotar el PAT expuesto y darme el nuevo como secret `GIT_PAT`.
2. API key LLM (OpenAI/Anthropic/Gemini) como secret.
3. Host y clave SSH de la VM Oracle (`DEPLOY_HOST`, `DEPLOY_SSH_KEY`) — o espera: puedo dejar el pipeline listo y el deploy se activa cuando las tenga.
4. Confirmar si la verificación Docker local (Fase 1/6) se hace ahora (wifi) o se aplaza.
