# Clinisalud Frontend - Dashboard Angular 19

## Descripción

Dashboard SPA del sistema hospitalario Clinisalud. Angular 19 con **Standalone Components**, **Signals** para estado, Angular Material y Jest como runner de tests.

## Tecnologías

- **Framework**: Angular 19.2 (standalone, control flow `@if/@for`, lazy loading por rutas)
- **Estado**: Signals + stores propios (`rxResource`/`shareReplay` para caché)
- **UI**: Angular Material
- **HTTP**: `HttpClient` + interceptores funcionales
- **Tiempo real**: Socket.IO client
- **Testing**: Jest + jest-preset-angular + jsdom (21 specs / ~152 tests, sin navegador)

## Arquitectura

```
src/app/
├── core/                     # Infraestructura transversal
│   ├── guards/auth.guard.ts  #   protección de rutas (INV-SEC-01)
│   ├── interceptors/auth.interceptor.ts  # JWT header + logout en 401/403 o usuario inactivo
│   ├── services/             #   auth, catalog, menu, notification, roles, socket, toast
│   ├── stores/               #   auth-store, catalog-store, config-store,
│   │                         #   notification-store, role-store, ui-store
│   └── models/
├── features/
│   ├── auth/pages/login/     # Login (única ruta pública)
│   ├── dashboard/            # home · manager-users · notifications
│   └── admissions/           # módulo más completo:
│       ├── pages/admission-form/          # registro/actualización de admisión
│       │   └── services/admission-form.facade.ts  # estado y flujos (componente delgado)
│       ├── pages/census/                  # censo hospitalario (egreso, reversión de estado)
│       ├── pages/authorization-manager/   # gestión de autorizaciones (/dashboard/authorizations)
│       ├── components/authorization-entry # componente único de captura de autorizaciones
│       │   ├── authorization-entry-dialog # wrapper modal para el formulario de admisión
│       │   └── cups-search-dialog         # búsqueda CUPS por tarifario
│       ├── store/admission.store.ts       # signal store del dominio
│       └── utils/                          # builders/validators/mappers puros (testeables)
├── layout/                   # main-layout, sidebar (menú dinámico), header, footer
└── shared/                   # admission-search (búsqueda dual documento/admisión),
                              # catalog-select (selector con filtrado), empty-state, utils
```

## Rutas

| Path | Componente | Acceso |
|---|---|---|
| `/login` | LoginComponent | Público |
| `/dashboard/home` | HomeComponent | Según menú (`INV-SEC-02`) |
| `/dashboard/users` | ManagerUsersComponent | ADMIN/SUPER_ADMIN |
| `/dashboard/notifications` | NotificationsComponent | Autenticado |
| `/dashboard/admission` | AdmissionFormComponent | ADMISIONES |
| `/dashboard/admission/census` | CensusComponent | ADMISIONES/MEDICO |
| `/dashboard/authorizations` | AuthorizationManagerComponent | ADMISIONES |

Lazy loading en todos los niveles; guard `authGuard` protege `/dashboard`.

## Convenciones clave

- **Nomenclatura híbrida**: código en inglés, datos BD y mensajes en español.
- **Componentes delgados**: la lógica vive en facades (`admission-form.facade.ts`, `authorization-manager.facade.ts`) y utilidades puras (`utils/`) — testeables sin DOM.
- **Stores de signals**: `CatalogStore` cachea catálogos en memoria; `AuthStore.logout()` limpia la caché atómicamente (`INV-CAT-01/02`).
- **Menú dinámico**: el backend devuelve las opciones según rol + sobreescrituras; el sidebar solo renderiza.
- Reglas de negocio implementadas: [`docs/spec/CLINISALUD-SPEC-CORE.md`](../docs/spec/CLINISALUD-SPEC-CORE.md).

## Desarrollo

```bash
npm install
npm start        # http://localhost:4200 (proxy a la API local)
npm run build    # producción → dist/
```

Variables relevantes: URL de la API y WebSocket definidas en los environments (`src/environments/`).

## Testing

```bash
npm test              # suite completa (Jest + jsdom, ~12 s)
npm run test:watch
npm run test:coverage
```

Los specs viven junto al archivo bajo test. Estrategia completa: [`docs/TESTING.md`](../docs/TESTING.md).
