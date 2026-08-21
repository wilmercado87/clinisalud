# Convención de Endpoints API

## Base URL

```
/api/v1/{recurso}
```

## Reglas

| Concepto | Convención | Ejemplo |
|---|---|---|
| Recursos | Plural nouns en inglés (kebab-case) | `/patients` |
| Sub-recursos | `/:parentId/{child}` | `/patients/:patientId/admissions` |
| Crear | `POST /{recurso}` | `POST /api/v1/patients` |
| Listar | `GET /{recurso}` | `GET /api/v1/patients` |
| Obtener uno | `GET /{recurso}/:id` | `GET /api/v1/patients/:id` |
| Actualizar parcial | `PATCH /{recurso}/:id` | `PATCH /api/v1/patients/:id` |
| Reemplazar | `PUT /{recurso}/:id` | Evitar, usar PATCH |
| Eliminar | `DELETE /{recurso}/:id` | `DELETE /api/v1/patients/:id` |
| Acción de negocio | `POST /{recurso}/:id/{accion}` | `POST /api/v1/users/:id/toggle-status` |
| Acción sobre colección | `POST /{recurso}/{accion}` | `POST /api/v1/notifications/read-all` |
| Catálogos | `GET /api/v1/catalogs/{tipo}` | `GET /api/v1/catalogs/document-types` |
| Query params | `?page=1&limit=20&sort=name` | Paginación, filtros, orden |

## Nomenclatura híbrida

| Contexto | Idioma | Ejemplo |
|---|---|---|
| URL path | Inglés (kebab) | `/api/v1/patients/:id/admissions` |
| Query params | Inglés (camelCase) | `?page=1&sortBy=name` |
| Body JSON | Inglés (camelCase) | `{ "documentTypeId": 1, "firstName": "Juan" }` |
| BD columnas | Español (SNAKE_CASE) | `DOCUMENTO_PACIENTE`, `FK_TIPO_DOCUMENTO` |
| Código JS/TS | Inglés (camelCase) | `patientService`, `findByDocument()` |

## Estructura de archivos

```
src/modules/{nombreModulo}/
  {nombre}.routes.ts     → define rutas del módulo montadas bajo /api/v1/{resource}
  {nombre}.controller.ts → handlers que validan y llaman al servicio
  {nombre}.service.ts    → lógica de negocio (orquestación + métodos privados por responsabilidad)
  {nombre}.validations.ts→ reglas express-validator (validación de entrada)
  {nombre}.types.ts      → interfaces DTO Request/Response
```

## Convención DTO (Request/Response)

- **Archivo:** `{module}.types.ts` dentro de cada módulo.
- **Request:** `<Verbo>SustantivoRequest` — entrada del cliente (`CreateAdmissionRequest`, `LoginRequest`, `UpdateProfileRequest`).
- **Response:** `<Sustantivo>Response` — salida hacia el cliente (`AdmissionResponse`, `UserResponse`, `NotificationResponse`, `CatalogItemResponse`).
- **Reglas:**
  - Los servicios reciben/retornan DTOs tipados (sin `any`); nunca reciben `req.body` sin tipar (el controller arma el DTO).
  - Los DTOs reflejan el contrato JSON camelCase del frontend; la validación de entrada vive en `{module}.validations.ts`, no en el servicio.
  - Mapeos de filas BD → respuesta mediante funciones `toXxxResponse` explícitas (evitar casts `as any`).
  - `src/utils/user.mapper.ts` centraliza el sanitizado de usuario (quitar `password`).
- **Nombres híbridos:** lógica en inglés (`toSafeUserJson`, `loadGrantedMenuIdsByRole`), mensajes y datos BD en español.

## Endpoints actuales

Fuente de verdad: los archivos `*.routes.ts` de `backend/src/modules/`. Roles: `SUPER_ADMIN`, `ADMIN`, `ADMISIONES`, `MEDICO`, `FACTURADOR`.

### Auth (`modules/auth/`)

| Método | Path | Acceso |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Público (rate limit por IP) |
| `POST` | `/api/v1/auth/forgot-password` | Público (rate limit por IP) |
| `PATCH` | `/api/v1/auth/profile` | Autenticado |
| `PATCH` | `/api/v1/auth/change-password` | Autenticado |

### Usuarios y menú (`modules/users/`)

| Método | Path | Acceso |
|---|---|---|
| `GET` | `/api/v1/users` | ADMIN, SUPER_ADMIN (solo usuarios gestionables) |
| `POST` | `/api/v1/users` | ADMIN, SUPER_ADMIN |
| `PATCH` | `/api/v1/users/:id/permissions` | ADMIN, SUPER_ADMIN (transaccional: rol + sobreescrituras) |
| `POST` | `/api/v1/users/:id/toggle-status` | ADMIN, SUPER_ADMIN |
| `GET` | `/api/v1/roles` | Autenticado |
| `GET` | `/api/v1/menu-options` | Autenticado |

### Notificaciones (`modules/notifications/`)

| Método | Path | Acceso |
|---|---|---|
| `GET` | `/api/v1/notifications` | Autenticado |
| `GET` | `/api/v1/notifications/unread-count` | Autenticado |
| `POST` | `/api/v1/notifications/:id/read` | Autenticado |
| `POST` | `/api/v1/notifications/read-all` | Autenticado |

### Catálogos (`modules/catalogs/`)

| Método | Path | Acceso |
|---|---|---|
| `GET` | `/api/v1/catalogs/:type` | Autenticado (tipos paramétricos genéricos) |
| `GET` | `/api/v1/catalogs/beds?status=&page=` | Autenticado (camas con estado) |
| `GET` | `/api/v1/catalogs/contracts` | Autenticado (contratos EPS + tarifario) |
| `GET` | `/api/v1/catalogs/cups/search?q=` | Autenticado (búsqueda CUPS por tarifario) |
| `GET` | `/api/v1/catalogs/diagnostics/search?q=` | Autenticado (búsqueda CIE-10) |
| `GET` | `/api/v1/catalogs/municipalities` | Autenticado |

### Admisiones (`modules/admissions/`)

| Método | Path | Acceso | Invariantes |
|---|---|---|---|
| `GET` | `/api/v1/admissions/patient-lookup?documentType&document` | + MEDICO | INV-AUT-01 |
| `POST` | `/api/v1/admissions` | ADMISIONES | INV-ADM-01..03, 06 |
| `GET` | `/api/v1/admissions/census` | + MEDICO | INV-ADM-04 |
| `GET` | `/api/v1/admissions/:admissionNumber` | ADMISIONES | INV-AUT-01 |
| `PATCH` | `/api/v1/admissions/:admissionNumber` | ADMISIONES | INV-ADM-01, 07 · INV-AUT-02/03 |
| `PATCH` | `/api/v1/admissions/:admissionNumber/state` | ADMISIONES | INV-ADM-04, 05 |
| `POST` | `/api/v1/admissions/:admissionNumber/discharge` | ADMISIONES | INV-ADM-05 |
| `POST` | `/api/v1/admissions/billability-check` | Solo ADMIN | INV-FAC-01 |

> Detalle de invariantes en [`spec/CLINISALUD-SPEC-CORE.md`](./spec/CLINISALUD-SPEC-CORE.md).

### Otros canales

| Canal | Descripción |
|---|---|
| WebSocket `/socket.io` | Notificaciones en tiempo real; handshake con token JWT (`backend/src/socket/socket.gateway.ts`) |
| `GET /health` | Healthcheck para deploy/smoke |
| `GET /api-docs` | Swagger UI (JSON en `/api-docs.json`) |
