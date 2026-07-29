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
  {nombre}.service.ts    → lógica de negocio
  {nombre}.types.ts      → interfaces DTO
```

## Endpoints actuales

| Método | Path | Módulo |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Auth |
| `PATCH` | `/api/v1/auth/profile` | Auth |
| `GET` | `/api/v1/roles` | Users |
| `GET` | `/api/v1/menu-options` | Users |
| `GET` | `/api/v1/users` | Users |
| `POST` | `/api/v1/users` | Users |
| `PATCH` | `/api/v1/users/:id/permissions` | Users |
| `POST` | `/api/v1/users/:id/toggle-status` | Users |
| `GET` | `/api/v1/notifications` | Notifications |
| `GET` | `/api/v1/notifications/unread-count` | Notifications |
| `POST` | `/api/v1/notifications/:id/read` | Notifications |
| `POST` | `/api/v1/notifications/read-all` | Notifications |
| `GET` | `/api/v1/catalogs/:type` | Catalogs |
