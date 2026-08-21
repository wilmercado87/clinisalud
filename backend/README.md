# Clinisalud Backend - API REST

## Descripción

API REST del sistema de gestión hospitalaria Clinisalud. Construida con Express.js y TypeScript, persistencia en PostgreSQL (Neon en producción, Docker/local en desarrollo).

## Tecnologías

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Lenguaje**: TypeScript 5.x
- **ORM**: Sequelize 6.x · **BD**: PostgreSQL
- **Auth**: JWT (24h, HS256) + bcryptjs + rate limiting
- **Tiempo real**: Socket.IO con autenticación JWT por handshake
- **Documentación**: Swagger/OpenAPI 3.0 (`/api-docs`) · **Logging**: Winston
- **Testing**: Jest (9 suites / 133 tests)

## Estructura de Archivos

```
src/
├── config/            # database.ts (Sequelize), swagger.ts
├── constants/         # index.ts: estados de admisión, máquinas de estado,
│                      #   roles, mensajes de negocio, plantillas de notificación
├── middlewares/       # AuthMiddleware (JWT+roles), Validation (express-validator),
│                      #   ErrorHandler, Security (helmet, rate limit)
├── models/            # 40 modelos Sequelize + associations.ts
├── modules/           # UN módulo por dominio:
│   ├── auth/          #   login, perfil, cambio/recuperación de contraseña
│   ├── users/         #   usuarios, roles, menú híbrido (roles+sobreescrituras)
│   ├── catalogs/      #   catálogos paramétricos, camas, contratos, CUPS/CIE-10
│   ├── notifications/ #   notificaciones persistentes + email
│   └── admissions/    #   admisiones, censo, egreso, autorizaciones, billability
│       └── {nombre}.{routes|controller|service|validations|types}.ts
├── socket/            # socket.gateway.ts (notificaciones en tiempo real)
├── scripts/           # db-alter.ts (sync no destructivo)
├── utils/             # Logger, Pagination, StatusCodes, user.mapper
├── seed.ts            # Carga inicial desde tablas_clinisalud/*.csv
├── __tests__/         # Tests Jest (ver docs/TESTING.md)
├── app.ts             # Express app (rutas montadas bajo /api/v1)
└── index.ts           # Punto de entrada (HTTP + Socket.IO)
```

Convención de módulos y endpoints: [`docs/CONVENCION-API.md`](../docs/CONVENCION-API.md). Reglas de negocio: [`docs/spec/CLINISALUD-SPEC-CORE.md`](../docs/spec/CLINISALUD-SPEC-CORE.md).

## Instalación

```bash
cp .env.example .env     # DATABASE_URL apunta a Postgres local
npm install
npm run seed             # Datos iniciales (catálogos, roles, admin)
npm run dev              # http://localhost:3000 (ts-node-dev)
```

## Scripts

| Script | Descripción |
|--------|------------|
| `npm run dev` | Servidor en desarrollo (ts-node-dev) |
| `npm run build` | Compilar TypeScript |
| `npm run seed` | Ejecutar seed desde `tablas_clinisalud/*.csv` |
| `npm test` / `test:watch` / `test:coverage` | Suite Jest (133 tests) |
| `npm run db:alter` | Sync no destructivo del esquema hacia la BD (`DATABASE_URL`) — usado por el CD |
| `npm run db:schema` | Regenerar `db/clinisalud.sql` (dump schema-only canónico) |

> El arranque normal **no** modifica la BD. La reestructuración destructiva solo ocurre con `DB_SYNC=force npm run dev` + seed.

## Endpoints (resumen)

Detalle completo con roles e invariantes: [`docs/CONVENCION-API.md`](../docs/CONVENCION-API.md).

| Grupo | Rutas |
|---|---|
| Auth | `POST /api/v1/auth/login` · `POST .../forgot-password` · `PATCH .../profile` · `PATCH .../change-password` |
| Usuarios | `GET|POST /api/v1/users` · `PATCH /users/:id/permissions` · `POST /users/:id/toggle-status` · `GET /roles` · `GET /menu-options` |
| Notificaciones | `GET /notifications` (+`unread-count`, `:id/read`, `read-all`) |
| Catálogos | `GET /catalogs/:type` (+`beds`, `contracts`, `municipalities`, `cups/search`, `diagnostics/search`) |
| Admisiones | `POST /admissions` · `GET /admissions/patient-lookup` · `GET /admissions/census` · `GET|PATCH /admissions/:admissionNumber` · `PATCH .../state` · `POST .../discharge` · `POST /admissions/billability-check` |

Swagger UI: http://localhost:3000/api-docs

## Autenticación

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinisalud.com","password":"Admin2026!"}'
```

Respuesta: `{ "token", "user", "menu" }`. Enviar el token como `Authorization: Bearer <token>`; todas las rutas excepto login lo exigen (`INV-SEC-01`).

## Roles

`SUPER_ADMIN`, `ADMIN`, `ADMISIONES`, `MEDICO`, `FACTURADOR` (`src/constants/index.ts → ROLE_CODES`). El acceso a módulos combina permisos de rol (`PermisoRolMenu`) + sobreescrituras granulares por usuario (`SobreescrituraMenuUsuario`) — `INV-SEC-02`.

## Modelos principales (40)

| Dominio | Modelos |
|---|---|
| Seguridad | `Usuario`, `Rol`, `OpcionMenu`, `PermisoRolMenu`, `SobreescrituraMenuUsuario`, `Notificacion`, `DestinatarioNotificacion` |
| Pacientes | `Paciente`, `Acompanante`, `TipoDocumento`, `TipoGenero`, `TipoParentesco` |
| Admisiones | `Admision`, `Cama`, `Autorizacion`, `TipoAutorizacion`, `TipoEstado`, `TipoOrigen` |
| Clínica | `Triage`, `TriagePrioridad`, `TipoTriage`, `DiagnosticoPaciente`, `Especialidad` |
| Tarifaria | `Contrato`, `Convenio`, `Tarifario`, `Cups`, `Articulado`, `Paragrafo*` (valor/edad/inclusión/aplicación), `ViaAcceso`, `TipoAcceso`, `CentroCosto`, `NivelAtencion` |
| Geografía | `Departamento`, `Municipio` |

Esquema canónico: `db/clinisalud.sql` (regenerable con `npm run db:schema`; validado por el CD contra producción).

## Testing

```bash
npm test        # 133 tests passing
```

Estrategia y trazabilidad SDD (`@spec:INV-*`): [`docs/TESTING.md`](../docs/TESTING.md).

## Variables de Entorno (.env)

```env
PORT=3000
JWT_SECRET=tu_secret_jwt
NODE_ENV=development
LOG_LEVEL=info
DATABASE_URL=postgresql://clinisalud:clinisalud@localhost:5432/clinisalud
CORS_ORIGIN=http://localhost:4200   # orígenes permitidos para API + WebSocket
```

## Licencia

Propietario - Clinisalud 2026
