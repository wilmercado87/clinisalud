# Clinisalud - Sistema de Gestión Hospitalaria

## Descripción

**Clinisalud** es un sistema integral de gestión hospitalaria que permite administración de pacientes, facturación, historia clínica y gestión de usuarios para instituciones de salud.

## Tecnologías

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 16+ (Sequelize ORM) — Neon en producción, Docker local
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI 3.0 (`/api-docs`)
- **Logging**: Winston
- **Testing**: Jest

### Frontend
- **Framework**: Angular 19 (Standalone Components)
- **State Management**: Signals
- **UI**: Angular Material
- **Testing**: Jest (jest-preset-angular + jsdom)

## Despliegue (producción)

- **Frontend**: https://clinisalud-frontend.onrender.com
- **API**: https://clinisalud-api.onrender.com (`/health`, `/api-docs`)
- **Base de datos**: Neon (PostgreSQL), 41 tablas, catálogos CUPS/CIE-10 cargados
- Infraestructura declarativa en `render.yaml`; deploy local con `docker compose up -d` (db, backend, frontend)

## Estructura del Proyecto

```
clinisalud/
├── backend/            # API REST
│   ├── src/
│   │   ├── config/      # Configuración (DB, Swagger)
│   │   ├── constants/   # Estados, máquinas de estado, roles, mensajes de negocio
│   │   ├── middlewares/ # Auth JWT+roles, validaciones, errores, security
│   │   ├── models/      # 40 modelos Sequelize + associations.ts
│   │   ├── modules/     # auth · users · catalogs · notifications · admissions
│   │   ├── socket/      # Socket.IO (notificaciones en tiempo real)
│   │   ├── utils/       # Logger, Pagination, StatusCodes
│   │   └── __tests__/   # Tests unitarios (Jest, 133)
│   ├── db/              # Dump schema-only canónico (clinisalud.sql)
│   └── Dockerfile
├── frontend/           # Dashboard Angular 19 (signals, standalone)
├── docs/               # Documentación técnica (spec SDD, API, testing, CI/CD)
│   └── spec/           # Spec core del dominio (invariantes @spec:INV-*)
├── scripts/            # Utilidades (db-export.sh, quality-gates.mjs)
├── tablas_clinisalud/  # CSVs fuente para el seed (catálogos CUPS/CIE-10, tarifarios)
├── render.yaml         # Blueprint de despliegue Render
└── docker-compose.yml  # Stack local (Postgres + API + frontend)
```

## Características (estado real)

### Core — ✅ implementado
- Autenticación JWT + rate limiting, RBAC híbrido (roles + sobreescrituras por usuario)
- Menú dinámico por permisos, gestión de usuarios con auditoría
- Notificaciones en tiempo real (Socket.IO) + persistencia
- Catálogos centralizados: CUPS (21.426), CIE-10 (12.423), EPS/contratos, geografía

### Admisiones, Censo y Autorizaciones — ✅ implementado
- Registro/actualización de admisión con control transaccional de camas
- Censo hospitalario con egreso y reversión de estados controlada
- Autorizaciones EPS anti-glosa (anti-duplicado, tope de cantidad, tarifario por contrato)
- Pre-validación de facturación (`billability-check`)

### Pendientes — ver roadmap completo en [`docs/spec/CLINISALUD-SPEC-CORE.md`](./docs/spec/CLINISALUD-SPEC-CORE.md)
- Citas médicas · Historia Clínica/Epicrisis · Farmacia · Facturación (liquidación ISS/SOAT) · Cartera/Glosas · Paz y Salvos/Reportes

## Installation (local)

### Backend

```bash
cd backend
cp .env.example .env    # DATABASE_URL apunta a postgres local
npm install
npm run seed            # Datos iniciales
npm run dev             # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start               # http://localhost:4200 (proxy a la API)
```

### Docker (stack completo)

```bash
docker compose up -d    # Postgres + API + frontend
```

## API y Swagger

- **UI**: http://localhost:3000/api-docs
- **JSON**: http://localhost:3000/api-docs.json
- Convenciones en `docs/CONVENCION-API.md`

## Testing

```bash
# Backend (9 suites / 133 tests)
cd backend
npm test

# Frontend (21 specs / ~152 tests, Jest + jsdom sin navegador)
cd frontend
npm test                # Unit tests
npm run test:watch      # Watch mode
npm run test:coverage   # Con cobertura
```

Estrategia y trazabilidad SDD (`@spec:INV-*`): [`docs/TESTING.md`](./docs/TESTING.md).

## Variables de Entorno

### Backend (.env)
```env
PORT=3000
JWT_SECRET=tu_secret_jwt
DATABASE_URL=postgresql://clinisalud:clinisalud@localhost:5432/clinisalud
NODE_ENV=development
LOG_LEVEL=info
```

## Referencias

- Documentación técnica completa: [`docs/`](./docs/README.md)
- Esquema de BD canónico: `backend/db/clinisalud.sql` (regenerable con `npm run db:schema`)

## Licencia

Proprietario - Clinisalud 2026