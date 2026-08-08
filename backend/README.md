# Clinisalud Backend - API REST

## Descripción

API REST del sistema de gestión hospitalaria Clinisalud. Construido con Express.js y TypeScript, persistencia en PostgreSQL.

## Tecnologías

- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Lenguaje**: TypeScript 5.x
- **ORM**: Sequelize 6.x
- **Database**: PostgreSQL 16 (Sequelize como ORM)
- **Auth**: JWT + bcryptjs
- **Documentación**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Testing**: Jest

## Estructura de Archivos

```
src/
├── config/
│   ├── database.ts      # Configuración Sequelize
│   └── swagger.ts     # Configuración Swagger
├── controllers/      # Controladores HTTP
│   ├── AuthController.ts
│   ├── UserController.ts
│   └── RoleController.ts
├── services/        # Lógica de negocio
│   ├── AuthService.ts
│   ├── PatientService.ts
│   ├── UserService.ts
│   ├── BillingService.ts
│   └── CatalogService.ts
├── models/          # Modelos Sequelize
│   ├── User.ts
│   ├── Paciente.ts
│   ├── Role.ts
│   └── ... (40+ modelos)
├── routes/         # Rutas Express
│   ├── AuthRoutes.ts
│   └── UserRoutes.ts
├── middlewares/     # Middlewares Express
│   ├── AuthMiddleware.ts
│   ├── ErrorHandlerMiddleware.ts
│   └── SecurityMiddleware.ts
├── constants/      # Constantes globales
│   └── index.ts
├── utils/          # Utilidades
│   ├── Logger.ts
│   ├── Pagination.ts
│   └── StatusCodes.ts
├── __tests__/      # Tests unitarios
├── app.ts          # Configuración Express
└── index.ts       # Punto de entrada
```

## Installation

```bash
npm install
npm run build
npm run seed    # Seed de datos iniciales
npm run dev     # Servidor en puerto 3000
```

## Scripts

| Script | Descripción |
|--------|------------|
| `npm run dev` | Iniciar servidor en desarrollo (ts-node-dev) |
| `npm run build` | Compilar TypeScript |
| `npm run seed` | Ejecutar seed |
| `npm test` | Ejecutar tests |
| `npm run test:watch` | Tests en watch mode |
| `npm run db:schema` | Regenerar `clinisalud.sql` desde la BD actual |

## Base de datos

Persistencia en **PostgreSQL** (Homebrew, local: `postgresql://clinisalud:clinisalud@localhost:5432/clinisalud`, configurable por `DATABASE_URL`). El esquema nace de los modelos Sequelize (`src/models/` + `src/models/associations.ts`) y queda reflejado en el archivo `clinisalud.sql` (artefacto de referencia único, generado con `pg_dump --schema-only` y regenerable con `npm run db:schema`).

El arranque normal del servidor **no** modifica la BD; la reestructuración completa (destructiva, pierde datos) solo ocurre con `DB_SYNC=force npm run dev` + seed desde `tablas_clinisalud/*.csv`.

## API Endpoints

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login con email/password |

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users` | Listar usuarios |
| POST | `/api/v1/users` | Crear usuario |
| GET | `/api/v1/users/:id` | Obtener usuario |
| PUT | `/api/v1/users/:id/permissions` | Actualizar permisos |
| PUT | `/api/v1/users/:id/toggle` | Toggle estado |

## Modelos Principales

- **User**: Usuarios del sistema
- **Paciente**: Registro de pacientes
- **Role**: Roles (ADMIN, DOC, FACT)
- **MenuOption**: Opciones de menú
- **FacturacionPaciente**: Admissions y facturación

## Autenticación

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinisalud.com","password":"Admin2026!"}'
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "...", "role": "ADMIN" },
  "menu": [...]
}
```

## Swagger

- **UI**: http://localhost:3000/api-docs
- **JSON**: http://localhost:3000/api-docs.json

## Testing

```bash
npm test           # 48 tests passing
npm run test:coverage  # Con cobertura
```

## Variables de Entorno

Crear `.env`:
```env
PORT=3000
JWT_SECRET=clinisalud_secret_key_2026
NODE_ENV=development
LOG_LEVEL=info
DATABASE_URL=postgresql://clinisalud:clinisalud@localhost:5432/clinisalud
```

## Contribuir

1. Fork el repositorio
2. Crear branch feature: `git checkout -b feature/nombre`
3. Commit cambios: `git commit -m 'Add feature'`
4. Push: `git push origin feature/nombre`
5. Crear Pull Request

## Licencia

Proprietario - Clinisalud 2026