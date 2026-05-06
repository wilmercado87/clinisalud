# Clinisalud - Sistema de Gestión Hospitalaria

## Descripción

**Clinisalud** es un sistema integral de gestión hospitalaria que permite administración de pacientes, facturación, historia clínica y gestión de usuarios para instituciones de salud.

## Tecnologías

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: SQLite (Sequelize ORM)
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Testing**: Jest

### Frontend
- **Framework**: Angular 17+ (Standalone Components)
- **State Management**: Signals
- **UI**: Material Design
- **HTTP Client**: HttpClient

## Estructura del Proyecto

```
clinisalud/
├── backend/           # API REST
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
│   └── database.sqlite
│
├── frontend/         # aplicación Angular
│   └── src/
│       └── app/
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
- Diagnósticos (CIE-10)
- Procedimientos (CUPS)

## Installation

### Backend

```bash
cd backend
npm install
npm run build
npm run seed    # Datos iniciales
npm start     # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm start     # http://localhost:4200
```

## API Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Iniciar sesión |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users` | Listar usuarios |
| POST | `/api/v1/users` | Crear usuario |
| GET | `/api/v1/users/:id` | Obtener usuario |
| PUT | `/api/v1/users/:id/permissions` | Actualizar permisos |
| PUT | `/api/v1/users/:id/toggle` | Activar/Desactivar |

## Swagger

Accede a la documentación interactiva en:
- **UI**: http://localhost:3000/api-docs
- **JSON**: http://localhost:3000/api-docs.json

## Testing

```bash
# Backend
cd backend
npm test           # Unit tests
npm run test:watch # Watch mode

# Frontend
cd frontend
ng test           # Karma tests
```

## Variables de Entorno

### Backend (.env)
```env
PORT=3000
JWT_SECRET=tu_secret_jwt
NODE_ENV=development
LOG_LEVEL=info
```

## Licencia

Proprietario - Clinisalud 2026