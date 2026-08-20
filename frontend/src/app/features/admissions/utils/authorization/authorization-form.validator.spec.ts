// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (validación de entrada)
import { AdmissionAuthorization } from '@features/admissions/models/admissions.model';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { AUTH_MESSAGES } from '@shared/utils/messages';
import { createAuthorizationForm } from './authorization-form.factory';
import { AuthorizationFormGroup, AuthorizationFormValue } from './authorization-form.types';
import {
  applyAuthorizationCupsSelection,
  applyAuthorizationQuantityMax,
  AUTHORIZATION_ERROR_RULES,
  clearAuthorizationCupsSelection,
  computeAuthorizationFieldErrors,
  evaluateAuthorizationEntryRules,
  formatAuthorizationViolationMessage,
} from './authorization-form.validator';

describe('authorization-form.validator', () => {
  describe('AUTHORIZATION_ERROR_RULES', () => {
    it('maps auth errors including min quantity', () => {
      const group = createAuthorizationForm();
      group.controls.quantity.setValue(0);
      const errors = extractFieldErrors(group, AUTHORIZATION_ERROR_RULES);
      expect(errors.authTypeId).toBe('Seleccione Tipo Autorización');
      expect(errors.authNumber).toBe('N° Autorización requerido');
      expect(errors.mapiissCode).toBe('Seleccione MAPIISS');
      expect(errors.quantity).toBe('Mínimo 1');
    });
  });

  describe('CUPS selection helpers', () => {
    let group: AuthorizationFormGroup;

    beforeEach(() => {
      group = createAuthorizationForm();
    });

    it('applies the CUPS selection with its max quantity', () => {
      applyAuthorizationCupsSelection(group, { code: '123', description: 'Consulta', maxQuantity: 5 });

      expect(group.controls.mapiissCode.value).toBe('123');
      expect(group.controls.mapiissDescription.value).toBe('Consulta');
      expect(group.controls.maxQuantity.value).toBe(5);

      group.controls.quantity.setValue(6);
      expect(group.controls.quantity.hasError('max')).toBe(true);

      group.controls.quantity.setValue(5);
      expect(group.controls.quantity.valid).toBe(true);
    });

    it('clears the selection and removes the max validator', () => {
      applyAuthorizationCupsSelection(group, { code: '123', description: 'Consulta', maxQuantity: 5 });
      clearAuthorizationCupsSelection(group);

      expect(group.controls.mapiissCode.value).toBe('');
      expect(group.controls.mapiissDescription.value).toBe('');
      expect(group.controls.maxQuantity.value).toBeNull();

      group.controls.quantity.setValue(50);
      expect(group.controls.quantity.valid).toBe(true);
    });

    it('does not limit the quantity when the CUPS has no max', () => {
      applyAuthorizationCupsSelection(group, { code: '9', description: 'Sin límite', maxQuantity: 0 });

      group.controls.quantity.setValue(4);
      expect(group.controls.quantity.valid).toBe(true);
    });

    it('applies a custom max quantity through applyAuthorizationQuantityMax', () => {
      applyAuthorizationQuantityMax(group, 3);
      group.controls.quantity.setValue(4);
      expect(group.controls.quantity.hasError('max')).toBe(true);
      group.controls.quantity.setValue(3);
      expect(group.controls.quantity.valid).toBe(true);
    });
  });

  describe('computeAuthorizationFieldErrors (INV-ADM-02)', () => {
    it('only reports field-level errors, not business rules', () => {
      const first = createAuthorizationForm();
      first.patchValue({ authTypeId: 5, authNumber: 'AUTH-001', feeScheduleId: 2, mapiissCode: 'MAPIISS-1', quantity: 2 });
      const second = createAuthorizationForm();
      second.patchValue({
        authTypeId: 5,
        authNumber: 'AUTH-001',
        feeScheduleId: 2,
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
      });

      const errors = computeAuthorizationFieldErrors([first, second]);
      expect(errors[0]).toEqual({});
      expect(errors[1]).toEqual({});
    });

    it('still reports missing required fields per entry', () => {
      const entry = createAuthorizationForm();
      entry.controls.quantity.setValue(0);
      const errors = computeAuthorizationFieldErrors([entry]);
      expect(errors[0].authTypeId).toBe('Seleccione Tipo Autorización');
      expect(errors[0].quantity).toBe('Mínimo 1');
    });
  });

  describe('evaluateAuthorizationEntryRules (INV-ADM-02)', () => {
    function fillEntry(entry: AuthorizationFormGroup, overrides: Partial<AuthorizationFormValue> = {}): void {
      entry.patchValue({
        authTypeId: 5,
        authNumber: 'AUTH-001',
        feeScheduleId: 2,
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
        ...overrides,
      });
    }

    function fillCupsEntry(entry: AuthorizationFormGroup, authNumber: string, quantity: number): void {
      entry.patchValue({ authTypeId: 5, authNumber, feeScheduleId: 2 });
      applyAuthorizationCupsSelection(entry, {
        code: 'MAPIISS-1',
        description: 'Procedimiento de prueba',
        maxQuantity: 5,
      });
      entry.controls.quantity.setValue(quantity);
    }

    function existingAuth(overrides: Partial<AdmissionAuthorization> = {}): AdmissionAuthorization {
      return {
        authTypeId: 5,
        authNumber: 'AUTH-001',
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
        feeScheduleId: 2,
        ...overrides,
      };
    }

    function queuedAuth(overrides: Partial<AuthorizationFormValue> = {}): AuthorizationFormValue {
      return {
        authTypeId: 5,
        authNumber: 'AUTH-001',
        feeScheduleId: 2,
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
        mapiissDescription: '',
        maxQuantity: 5,
        ...overrides,
      };
    }

    it('blocks an entry whose authNumber, CUPS and fee schedule already exist in the admission', () => {
      const entry = createAuthorizationForm();
      fillEntry(entry);

      const violations = evaluateAuthorizationEntryRules([entry], [existingAuth({ authTypeId: 4 })], []);
      expect(violations).toMatchObject([{ row: 0, kind: 'duplicate-entry' }]);
    });

    it('blocks an entry that duplicates another entry in the modal', () => {
      const first = createAuthorizationForm();
      fillEntry(first);
      const second = createAuthorizationForm();
      fillEntry(second);

      const violations = evaluateAuthorizationEntryRules([first, second], [], []);
      expect(violations.map((v) => v.row)).toEqual([0, 1]);
      expect(violations.every((v) => v.kind === 'duplicate-entry')).toBe(true);
    });

    it('blocks an entry that duplicates a queued authorization not yet persisted', () => {
      const entry = createAuthorizationForm();
      fillEntry(entry);

      const violations = evaluateAuthorizationEntryRules([entry], [], [queuedAuth()]);
      expect(violations).toMatchObject([{ row: 0, kind: 'duplicate-entry' }]);
    });

    it('allows the same authNumber for a different CUPS or fee schedule', () => {
      const first = createAuthorizationForm();
      fillEntry(first);
      const second = createAuthorizationForm();
      fillEntry(second, { mapiissCode: 'MAPIISS-2' });

      const violations = evaluateAuthorizationEntryRules([first, second], [], []);
      expect(violations).toEqual([]);
    });

    it('allows a different authNumber for the same CUPS and fee schedule (different authorization)', () => {
      const entry = createAuthorizationForm();
      fillEntry(entry);

      const violations = evaluateAuthorizationEntryRules([entry], [existingAuth({ authNumber: 'AUTH-002' })], []);
      expect(violations).toEqual([]);
    });

    it('blocks an entry when the accumulated quantity of the MAPIISS exceeds the patient max', () => {
      const entry = createAuthorizationForm();
      fillCupsEntry(entry, 'AUTH-100', 2);

      const violations = evaluateAuthorizationEntryRules([entry], [existingAuth({ quantity: 4, authTypeId: 4 })], []);
      expect(violations).toMatchObject([{ row: 0, kind: 'quantity-exceeded', quantity: 2, maxQuantity: 5 }]);
    });

    it('allows an entry when the accumulated quantity stays within the patient max', () => {
      const entry = createAuthorizationForm();
      fillCupsEntry(entry, 'AUTH-100', 1);

      const violations = evaluateAuthorizationEntryRules([entry], [existingAuth({ quantity: 4, authTypeId: 4 })], []);
      expect(violations).toEqual([]);
    });

    it('blocks entries of the same CUPS when their combined quantity exceeds the max', () => {
      const first = createAuthorizationForm();
      fillCupsEntry(first, 'AUTH-001', 3);
      const second = createAuthorizationForm();
      fillCupsEntry(second, 'AUTH-002', 3);

      const violations = evaluateAuthorizationEntryRules([first, second], [], []);
      expect(violations.map((v) => v.row)).toEqual([0, 1]);
      expect(violations.every((v) => v.kind === 'quantity-exceeded')).toBe(true);
    });

    it('blocks an entry when quantity exceeds the max accumulated with queued authorizations', () => {
      const entry = createAuthorizationForm();
      fillCupsEntry(entry, 'AUTH-100', 2);

      const violations = evaluateAuthorizationEntryRules([entry], [], [queuedAuth({ quantity: 4 })]);
      expect(violations).toMatchObject([{ row: 0, kind: 'quantity-exceeded' }]);
    });

    it('detects duplicates case-insensitively and ignoring whitespace', () => {
      const first = createAuthorizationForm();
      fillEntry(first, { authNumber: ' auth-001 ' });
      const second = createAuthorizationForm();
      fillEntry(second, { authNumber: 'AUTH-001' });

      const violations = evaluateAuthorizationEntryRules([first, second], [], []);
      expect(violations.map((v) => v.row)).toEqual([0, 1]);
      expect(violations.every((v) => v.kind === 'duplicate-entry')).toBe(true);
    });
  });

  describe('formatAuthorizationViolationMessage', () => {
    it('includes the auth number and CUPS in a duplicate-entry message', () => {
      const message = formatAuthorizationViolationMessage(
        { row: 0, kind: 'duplicate-entry', authNumber: 'AUTH-001', mapiissCode: 'MAPIISS-1', feeScheduleId: 2 },
      );
      expect(message).toBe('Ya existe una autorización con N° AUTH-001 para el CUPS MAPIISS-1 en la admisión o en esta solicitud');
    });

    it('includes the quantity, CUPS and max quantity in a quantity-exceeded message', () => {
      const message = formatAuthorizationViolationMessage(
        { row: 0, kind: 'quantity-exceeded', mapiissCode: 'MAPIISS-1', quantity: 2, maxQuantity: 5 },
      );
      expect(message).toBe(
        'La cantidad autorizada (2) del CUPS MAPIISS-1 supera el máximo permitido por paciente (5)',
      );
    });
  });
});
