import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ADMISSION_ERROR_RULES,
  applyAuthCupsSelection,
  applyRequiredValidators,
  applyAuthQuantityMax,
  AUTH_ERROR_RULES,
  clearAuthCupsSelection,
  COMPANION_ERROR_RULES,
  COMPANION_FORMAT_VALIDATORS,
  COMPANION_REQUIRED_KEYS,
  createPatientFormatValidators,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from './admission-form-validator';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { createAuthEntryForm } from './admission-form.factory';
import { AuthFormGroup } from './admission-form.types';

describe('admission-form-validator', () => {
  const today = new Date(2026, 0, 15);

  describe('createPatientFormatValidators', () => {
    it('rejects a birth date in the future', () => {
      const validators = createPatientFormatValidators(today);
      const control = new FormControl<Date | null>(new Date(2026, 1, 1), validators['birthDate']);
      expect(control.errors?.['dateInFuture']).toBeTruthy();
    });

    it('accepts a birth date today or before', () => {
      const validators = createPatientFormatValidators(today);
      const control = new FormControl<Date | null>(new Date(2026, 0, 15), validators['birthDate']);
      expect(control.valid).toBeTrue();
    });

    it('rejects an invalid age', () => {
      const validators = createPatientFormatValidators(today);
      const control = new FormControl<string>('abc', validators['age']);
      expect(control.errors?.['invalidAge']).toBeTruthy();
    });

    it('rejects an invalid disability value', () => {
      const validators = createPatientFormatValidators(today);
      const control = new FormControl<string>('QUIZAS', validators['disability']);
      expect(control.errors?.['invalidDisability']).toBeTruthy();
    });
  });

  describe('applyRequiredValidators', () => {
    it('adds required plus format validators when required is true', () => {
      const group = new FormGroup({
        firstName: new FormControl<string>(''),
        document: new FormControl<string>(''),
      });
      applyRequiredValidators(group, ['firstName', 'document'], COMPANION_FORMAT_VALIDATORS, true);
      expect(group.controls.firstName.hasError('required')).toBeTrue();
      group.controls.firstName.setValue('Ana');
      expect(group.controls.firstName.valid).toBeTrue();
      group.controls.document.setValue('abc');
      expect(group.controls.document.hasError('invalidNumeric')).toBeTrue();
    });

    it('keeps only format validators when required is false', () => {
      const group = new FormGroup({
        document: new FormControl<string>(''),
      });
      applyRequiredValidators(group, ['document'], COMPANION_FORMAT_VALIDATORS, false);
      expect(group.controls.document.hasError('required')).toBeFalse();
      group.controls.document.setValue('abc');
      expect(group.controls.document.hasError('invalidNumeric')).toBeTrue();
    });
  });

  describe('extractFieldErrors with rules', () => {
    it('maps patient errors to Spanish messages', () => {
      const group = new FormGroup({
        document: new FormControl<string>(''),
        firstName: new FormControl<string>(''),
        lastName: new FormControl<string>(''),
        birthDate: new FormControl<Date | null>(null),
        disability: new FormControl<string>(''),
        phone: new FormControl<string>('123'),
        email: new FormControl<string>('correo'),
      });
      const validators = createPatientFormatValidators(today);
      applyRequiredValidators(
        group,
        ['document', 'firstName', 'lastName', 'birthDate', 'disability', 'phone', 'email'],
        validators,
        true,
      );

      const errors = extractFieldErrors(group, PATIENT_ERROR_RULES);
      expect(errors.document).toBe('El número de documento es requerido');
      expect(errors.firstName).toBe('El nombre es requerido');
      expect(errors.birthDate).toBe('La fecha de nacimiento es requerida');
      expect(errors.disability).toBe('La discapacidad es requerida');
      expect(errors.phone).toBe('Ingrese un teléfono válido');
      expect(errors.email).toBe('Ingrese un correo válido');
    });

    it('returns null for valid controls', () => {
      const group = new FormGroup({
        document: new FormControl<string>('123456'),
        firstName: new FormControl<string>('Ana'),
        lastName: new FormControl<string>('Perez'),
        birthDate: new FormControl<Date | null>(new Date(1990, 0, 1)),
        disability: new FormControl<string>('NO'),
        phone: new FormControl<string>('3001234567'),
        email: new FormControl<string>('ana@correo.com'),
      });
      const errors = extractFieldErrors(group, PATIENT_ERROR_RULES);
      expect(Object.values(errors).every((message) => message === null)).toBeTrue();
    });

    it('maps companion errors', () => {
      const group = new FormGroup({
        firstName: new FormControl<string>(''),
        document: new FormControl<string>('abc'),
        phone: new FormControl<string>('123'),
      });
      applyRequiredValidators(group, ['firstName', 'document', 'phone'], COMPANION_FORMAT_VALIDATORS, true);
      const errors = extractFieldErrors(group, COMPANION_ERROR_RULES);
      expect(errors.firstName).toBe('El nombre es requerido');
      expect(errors.document).toBe('Solo se permiten números');
      expect(errors.phone).toBe('Ingrese un teléfono válido');
    });

    it('maps admission errors', () => {
      const group = new FormGroup({
        observations: new FormControl<string>(''),
      });
      applyRequiredValidators(group, ['observations'], {}, true);
      const errors = extractFieldErrors(group, ADMISSION_ERROR_RULES);
      expect(errors.observations).toBe('Las observaciones son requeridas');
    });

    it('maps auth errors including min quantity', () => {
      const group = new FormGroup({
        authTypeId: new FormControl<number | null>(null),
        authNumber: new FormControl<string>(''),
        feeScheduleId: new FormControl<number | null>(null),
        mapiissCode: new FormControl<string>(''),
        quantity: new FormControl<number | null>(0),
      });
      applyRequiredValidators(
        group,
        ['authTypeId', 'authNumber', 'feeScheduleId', 'mapiissCode', 'quantity'],
        { quantity: [Validators.min(1)] },
        true,
      );
      const errors = extractFieldErrors(group, AUTH_ERROR_RULES);
      expect(errors.authTypeId).toBe('Seleccione Tipo Autorización');
      expect(errors.authNumber).toBe('N° Autorización requerido');
      expect(errors.feeScheduleId).toBe('Seleccione Tarifario');
      expect(errors.mapiissCode).toBe('Seleccione MAPIISS');
      expect(errors.quantity).toBe('Mínimo 1');
    });
  });

  describe('auth CUPS selection helpers', () => {
    let group: AuthFormGroup;

    beforeEach(() => {
      group = createAuthEntryForm();
    });

    it('applies the CUPS selection with its max quantity', () => {
      applyAuthCupsSelection(group, { code: '123', description: 'Consulta', maxQuantity: 5 });

      expect(group.controls.mapiissCode.value).toBe('123');
      expect(group.controls.description.value).toBe('Consulta');
      expect(group.controls.maxQuantity.value).toBe(5);

      group.controls.quantity.setValue(6);
      expect(group.controls.quantity.hasError('max')).toBeTrue();

      group.controls.quantity.setValue(5);
      expect(group.controls.quantity.valid).toBeTrue();
    });

    it('clears the selection and removes the max validator', () => {
      applyAuthCupsSelection(group, { code: '123', description: 'Consulta', maxQuantity: 5 });
      clearAuthCupsSelection(group);

      expect(group.controls.mapiissCode.value).toBe('');
      expect(group.controls.description.value).toBe('');
      expect(group.controls.maxQuantity.value).toBeNull();

      group.controls.quantity.setValue(50);
      expect(group.controls.quantity.valid).toBeTrue();
    });

    it('does not limit the quantity when the CUPS has no max', () => {
      applyAuthCupsSelection(group, { code: '9', description: 'Sin límite', maxQuantity: 0 });

      group.controls.quantity.setValue(4);
      expect(group.controls.quantity.valid).toBeTrue();
    });

    it('applies a custom max quantity through applyAuthQuantityMax', () => {
      applyAuthQuantityMax(group, 3);
      group.controls.quantity.setValue(4);
      expect(group.controls.quantity.hasError('max')).toBeTrue();
      group.controls.quantity.setValue(3);
      expect(group.controls.quantity.valid).toBeTrue();
    });
  });

  describe('required keys', () => {
    it('exposes the patient required keys', () => {
      expect(PATIENT_REQUIRED_KEYS).toEqual([
        'firstName',
        'lastName',
        'birthDate',
        'genderId',
        'disability',
        'userTypeId',
      ]);
    });

    it('exposes the companion required keys', () => {
      expect(COMPANION_REQUIRED_KEYS).toEqual([
        'firstName',
        'lastName',
        'documentTypeId',
        'document',
        'address',
        'relationshipId',
        'phone',
      ]);
    });
  });
});
