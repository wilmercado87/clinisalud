En este proyecto, los tests de servicios requieren una estrategia especial debido al acoplamiento de Sequelize.

## Estrategia de Testing

### Tests Unitarios (con mocks manuales)

```bash
npm test
```

- Los tests de servicios corren con `jest.mock()` en cada archivo de test (ver `__tests__/AdmissionsService.test.ts`).
- Los tests de API usan `supertest` contra la app de Express con el servicio mockeado (ver `__tests__/AdmissionsApi.test.ts`). Importante: la app se importa con `require("../app").default` para que el hoisting de `jest.mock` aplique sobre los `jest.fn()` compartidos.

### Tests de Integración (con BD real)

Pendiente: usar una BD SQLite en memoria (`:memory:`) con el seeder para probar el flujo transaccional completo (rollback, concurrencia).

### Cobertura Actual

```
Test Suites: 8 passed
Tests:       105+ passed
- ApiError.test.ts            - Errores API
- constants.test.ts           - Constantes
- StatusCodes.test.ts         - Códigos HTTP
- BillingService.test.ts      - Servicio facturación
- UserService.test.ts         - Servicio usuarios
- AuthService.test.ts         - Servicio auth
- CatalogsService.test.ts     - Servicio catálogos
- AdmissionsService.test.ts   - Servicio admisiones (20 casos, incluye INV-ADM-01/02 y retry de número)
- AdmissionsApi.test.ts       - API admisiones (validaciones 422, auth 401, flujo 201)
```

### Agregar nuevos tests

1. **Crear archivo en** `__tests__/`
2. **Usar mocks de Sequelize:**

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

3. **Trazabilidad SDD:** cada test de invariante debe citar el identificador del spec (`@spec:INV-XX` o el nombre en el `it(...)`).

### Convenciones del módulo de admisiones

- `roomId` es obligatorio (INV-ADM-01): cama debe existir y estar en estado `0` (disponible).
- Los estados de admisión se buscan por descripción (`REGISTRADA`, `EN_ATENCION`, `CON_EPICRISIS`, `FACTURADA`, `EGRESADA`) vía constantes `ADMISSION_STATUS` en `src/constants`.
- Las autorizaciones enviadas deben incluir `authTypeId`, `authNumber` y `mapiissCode` (INV-ADM-02/03).
