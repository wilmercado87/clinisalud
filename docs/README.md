# Docs - Clinisalud

Índice de documentación técnica del proyecto.

## Guía rápida por perfil

| Perfil | Empieza por |
|---|---|
| Conocer el dominio y reglas de negocio | [`spec/CLINISALUD-SPEC-CORE.md`](./spec/CLINISALUD-SPEC-CORE.md) — invariantes `@spec:INV-*` con estado de implementación y mapa de código |
| Desarrollar backend | [`backend/README.md`](../backend/README.md) + [`CONVENCION-API.md`](./CONVENCION-API.md) |
| Desarrollar frontend | [`frontend/README.md`](../frontend/README.md) |
| Escribir tests | [`TESTING.md`](./TESTING.md) — trazabilidad SDD obligatoria (`@spec:INV-…`) |
| Deploy / DevOps | [`CI-CD-PLAN.md`](./CI-CD-PLAN.md) |

## Documentación general

| Documento | Descripción |
|---|---|
| [spec/CLINISALUD-SPEC-CORE.md](./spec/CLINISALUD-SPEC-CORE.md) | **Spec maestro (SDD)**: invariantes de negocio por módulo, estado de implementación (✅/🟡/⏳), endpoints y código que respalda cada invariante. Fuente de verdad del dominio |
| [CONVENCION-API.md](./CONVENCION-API.md) | Convenciones REST (kebab-case plural, camelCase, DTOs) + tabla completa de endpoints activos |
| [TESTING.md](./TESTING.md) | Estrategia de testing backend y frontend (Jest), cobertura y trazabilidad SDD |
| [CI-CD-PLAN.md](./CI-CD-PLAN.md) | CI en push/PR (compilación, tests, gates, agente opencode) + CD solo por tag `vX.Y.Z` (sync Neon no destructivo + deploy Render + smoke) |
| [dictamen-normalizacion.md](./dictamen-normalizacion.md) | *(Registro histórico 2026-08-08)* Dictamen de normalización del esquema PostgreSQL (41 tablas, FKs verificadas, huérfanos articulado) |

## Bitácoras de sesión

| Fecha | Resumen |
|---|---|
| [2026-08-15](./session/2026-08-15.md) | Admisión: selector de cama, modo actualización, modal de autorizaciones, refactor facade (600→139 líneas) |

> Convención: las bitácoras de sesión viven en `session/YYYY-MM-DD.md` con decisiones, archivos nuevos y pendientes.

## Estado de módulos (resumen)

| Módulo | Estado |
|---|---|
| Core (auth, usuarios/RBAC, catálogos, notificaciones) | ✅ |
| Admisiones, Censo y Autorizaciones | ✅ |
| Facturación (pre-validación anti-glosa) | 🟡 parcial |
| Citas · Historia Clínica · Farmacia · Cartera · Paz y Salvos | ⏳ |

Detalle completo con evidencia de código: [`spec/CLINISALUD-SPEC-CORE.md § RESUMEN GLOBAL`](./spec/CLINISALUD-SPEC-CORE.md).

## Referencias de código

- `backend/` → API REST Node/Express (README propio, `.env.example`)
- `frontend/` → Dashboard Angular 19 (README propio)
- `backend/db/clinisalud.sql` → dump schema-only canónico (regenerar con `npm run db:schema`)
- `scripts/db-export.sh` → migración de datos entre Postgres (local/Neon)
- `render.yaml` → blueprint de servicios Render del despliegue
