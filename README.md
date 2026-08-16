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
│   │   ├── controllers/ # Controladores HTTP
│   │   ├── services/    # Lógica de negocio
│   │   ├── models/      # Modelos Sequelize
│   │   ├── routes/      # Rutas API
│   │   ├── middlewares/ # Middlewares Express
│   │   ├── constants/  # Constantes globales
│   │   ├── utils/      # Utilidades
│   │   └── __tests__/  # Tests unitarios
│   ├── db/              # Dump schema-only canónico (clinisalud.sql)
│   └── Dockerfile
├── frontend/           # Dashboard Angular 19
├── docs/               # Documentación técnica (API, testing, CI/CD, spec, dictamen BD)
│   └── spec/           # Spec core del dominio
├── scripts/            # Utilidades (db-export.sh)
├── render.yaml         # Blueprint de despliegue Render
└── docker compose.yml  # Stack local (Postgres + API + frontend)
```

## Características

### Módulo de Usuarios
- Autenticación JWT
- Gestión de roles y permisos
- Menú dinámico por rol

### Módulo de Pacientes
- Registro de pacientes
- Búsqueda por documento
- Historial médico

### Módulo de Facturación
- Admisión de pacientes
- Cálculo de copagos
- Estados: pendiente/pagado/cancelado

### Catálogos
- Departamentos, Municipios
- Tipos de documento
- Convenios, Tarifarios
- Diagnósticos (CIE-10): 12.423 códigos
- Procedimientos (CUPS): 21.426 códigos

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
# Backend
cd backend
npm test                # Unit tests (jest)

# Frontend
cd frontend
npm test                # Unit tests (jest, sin navegador — jsdom)
npm run test:watch      # Watch mode
npm run test:coverage   # Con cobertura
```

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