En este proyecto, los tests de servicios requieren una estrategia especial debido al acoplamiento de Sequelize.

## Estrategia de Testing

### Tests Unitarios (con mocks manuales)

```bash
# Los tests existentes coren con jest.mock() en cada archivo de test
npm test
```

### Tests de Integración (con BD en memoria)

```bash
# Requiere crear test-database.ts con Sequelize en memoria
npm run test:integration
```

### Cobertura Actual

```
Test Suites: 4 passed
Tests:       35 passed
- ApiError.test.ts       - Errores API
- constants.test.ts      - Constantes
- StatusCodes.test.ts    - Códigos HTTP
- BillingService.test.ts - Servicio facturation
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

### Pendiente: PatientService, AuthService, UserService

Estos servicios requieren integración real con BD o mocks más sofisticados de Sequelize (siniron.mock-深厚).