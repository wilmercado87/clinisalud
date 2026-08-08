# Docs - Clinisalud

Índice de documentación técnica del proyecto.

## Documentación general

| Documento | Descripción |
|---|---|
| [CI-CD-PLAN.md](./CI-CD-PLAN.md) | Plan CI/CD: estado real (producción desplegada en Render + Neon) y fases pendientes (CI, agentes de revisión, E2E, monitoreo) |
| [CONVENCION-API.md](./CONVENCION-API.md) | Convenciones de la API REST (rutas kebab-case plural, body camelCase, naming, códigos HTTP) |
| [TESTING.md](./TESTING.md) | Guía de testing del backend (jest, cómo correr la suite) |
| [spec/CLINISALUD-SPEC-CORE.md](./spec/CLINISALUD-SPEC-CORE.md) | Especificación core del dominio (invariantes de negocio) |
| [dictamen-normalizacion.md](./dictamen-normalizacion.md) | Dictamen de normalización del esquema PostgreSQL (45 FKs, códigos huérfanos sin catálogo) |

## Referencias de código

- `backend/` → API REST Node/Express (README propio, `.env.example`)
- `frontend/` → Dashboard Angular 19 (README propio)
- `backend/db/clinisalud.sql` → dump schema-only canónico (regenerar con `npm run db:schema`)
- `scripts/db-export.sh` → migración de datos entre Postgres (local/Neon)
- `render.yaml` → blueprint de servicios Render del despliegue