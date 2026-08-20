import { FormControl, FormGroup } from '@angular/forms';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import {
  ADMISSION_ERROR_RULES,
  AGE_INVALID_MESSAGE,
  applyRequiredValidators,
  COMPANION_ERROR_RULES,
  COMPANION_FORMAT_VALIDATORS,
  COMPANION_REQUIRED_KEYS,
  createPatientFormatValidators,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from './admission-form.validator';

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
      expect(control.valid).toBe(true);
    });

    it('rejects a birth date whose computed age exceeds 120 years', () => {
      const validators = createPatientFormatValidators(today);
      const control = new FormControl<Date | null>(new Date(1800, 0, 1), validators['birthDate']);
      expect(control.errors?.['invalidAge']).toBeTruthy();
    });

    it('maps the birth date age error to the PATIENT_ERROR_RULES message', () => {
      const validators = createPatientFormatValidators(today);
      const group = new FormGroup({
        birthDate: new FormControl<Date | null>(new Date(1800, 0, 1), validators['birthDate']),
      });
      const errors = extractFieldErrors(group, PATIENT_ERROR_RULES);
      expect(errors.birthDate).toBe(AGE_INVALID_MESSAGE);
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
      expect(group.controls.firstName.hasError('required')).toBe(true);
      group.controls.firstName.setValue('Ana');
      expect(group.controls.firstName.valid).toBe(true);
      group.controls.document.setValue('abc');
      expect(group.controls.document.hasError('invalidNumeric')).toBe(true);
    });

    it('keeps only format validators when required is false', () => {
      const group = new FormGroup({
        document: new FormControl<string>(''),
      });
      applyRequiredValidators(group, ['document'], COMPANION_FORMAT_VALIDATORS, false);
      expect(group.controls.document.hasError('required')).toBe(false);
      group.controls.document.setValue('abc');
      expect(group.controls.document.hasError('invalidNumeric')).toBe(true);
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
      expect(Object.values(errors).every((message) => message === null)).toBe(true);
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
