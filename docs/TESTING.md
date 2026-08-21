En este proyecto, los tests de servicios requieren una estrategia especial debido al acoplamiento de Sequelize.

## Estado actual (2026-08)

| Suite | Tests | Comando |
|---|---|---|
| Backend | 9 suites / **133 tests** | `cd backend && npm test` |
| Frontend | 21 specs / ~152 tests | `cd frontend && npm test` |

CI ejecuta ambas suites en cada push/PR a `main` (ver `docs/CI-CD-PLAN.md`).

---

## Backend (Jest + ts-jest)

### Estrategia: tests unitarios con mocks manuales

```bash
cd backend && npm test          # suite completa
npm run test:watch              # watch mode
npm run test:coverage           # cobertura
```

- Los tests de servicios corren con `jest.mock()` en cada archivo de test (ver `__tests__/AdmissionsService.test.ts`).
- Los tests de API usan `supertest` contra la app de Express con el servicio mockeado (ver `__tests__/AdmissionsApi.test.ts`). Importante: la app se importa con `require("../app").default` para que el hoisting de `jest.mock` aplique sobre los `jest.fn()` compartidos.

### Cobertura por suite (`backend/src/__tests__/`)

```
AdmissionsApi.test.ts        16  - API admisiones (validaciones 422, auth 401, flujo 201)
AdmissionsService.test.ts    57  - Servicio admisiones (INV-ADM-01..07, INV-AUT-*, INV-FAC-01/04)
ApiError.test.ts             11  - Errores API
AuthService.test.ts           4  - Servicio auth (INV-SEC-01)
CatalogsService.test.ts      14  - Servicio catálogos
NotificationsService.test.ts  6  - Notificaciones + auditoría (INV-SEC-04)
StatusCodes.test.ts            8  - Códigos HTTP
UserService.test.ts           13  - Usuarios y permisos (INV-SEC-02/03/04)
constants.test.ts              4  - Constantes y máquinas de estado
```

### Trazabilidad SDD

Cada test de invariante debe citar el identificador del spec (`@spec:INV-XX-nn`) en el `it(...)` o comentario. Ejemplos vivos:

- `"should throw if bed is not available (INV-ADM-01)"` — AdmissionsService.test.ts
- `"should reject two authorizations with the same number, CUPS and tariff (INV-ADM-02)"`
- `@spec:INV-SEC-03` — UserService.test.ts (protección de privilegios administrativos)

El gate de calidad de CI advierte si un test modificado no cita su invariante (`scripts/quality-gates.mjs`).

### Agregar nuevos tests

1. Crear archivo en `backend/src/__tests__/`
2. Usar mocks de Sequelize:

```typescript
jest.mock('../config/database', () => ({
  default: {},
}));

jest.mock('../models/NombreModelo', () => ({
  default: class {
    static findOne = jest.fn();
    static findAll = jest.fn();
    static create = jest.fn();
  },
}));
```

3. Citar la invariante SDD correspondiente.

### Tests de integración (pendiente)

Usar una BD PostgreSQL efímera (docker) con el seeder para probar el flujo transaccional completo (rollback, concurrencia de camas, numeración de admisiones).

### Convenciones del módulo de admisiones

- La cama se valida contra estado `0` (disponible); egreso libera cama transaccionalmente (INV-ADM-01).
- Los estados de admisión se manejan por descripción (`REGISTRADA`, `EN_ATENCION`, `CON_EPICRISIS`, `FACTURADA`, `EGRESADA`) vía constantes `ADMISSION_STATUS` / `ADMISSION_STATE_MACHINE` en `src/constants`.
- Las autorizaciones enviadas deben incluir `authTypeId`, `authNumber`, `mapiissCode`, `feeScheduleId` y cantidad ≥ 1 (INV-ADM-02/03).

---

## Frontend (Jest + jest-preset-angular + jsdom)

Migrado de Karma/Jasmine a Jest: corre sin navegador (~12 s), mismo runner que backend.

```bash
cd frontend && npm test          # suite completa
npm run test:watch               # watch mode
npm run test:coverage            # cobertura
```

### Qué se prueba

| Área | Specs |
|---|---|
| Admisiones (form, facade, store, validators, census) | `features/admissions/**` — 11 specs |
| Autorizaciones (entry, dialog, manager, cups-search) | incluidas arriba |
| Dashboard (home, manager-users, menu-utils) | `features/dashboard/**` |
| Core/shared (catalog-store, admission-search, catalog-select) | `core/`, `shared/` |
| Layout y app | `layout/main-layout`, `app.component` |

### Convenciones

- Los specs viven junto al archivo bajo test (`*.component.spec.ts`).
- Los tests usan los mismos principios de mocks manuales; no hay dependencia de Chrome/Karma.
- Estado conocido: 4 fallos preexistentes en `CatalogSelectComponent` (ver `docs/session/2026-08-15.md`).
