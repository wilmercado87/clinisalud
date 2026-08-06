import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  ageValidator,
  disabilityValidator,
  maxDateValidator,
  numericValidator,
  phoneValidator,
} from '@shared/utils/form-validators';
import { AuthFormGroup } from './admission-form.types';
export {
  ErrorRules,
  extractFieldErrors,
  FieldErrors,
} from '@shared/utils/form-field-errors';

export const PATIENT_REQUIRED_KEYS = [
  'firstName',
  'lastName',
  'birthDate',
  'genderId',
  'disability',
  'userTypeId',
];

export const COMPANION_REQUIRED_KEYS = [
  'firstName',
  'lastName',
  'documentTypeId',
  'document',
  'address',
  'relationshipId',
  'phone',
];

export function createPatientFormatValidators(today: Date): Record<string, ValidatorFn[]> {
  return {
    birthDate: [maxDateValidator(today)],
    age: [ageValidator],
    disability: [disabilityValidator],
    phone: [phoneValidator],
    email: [Validators.email],
  };
}

export const COMPANION_FORMAT_VALIDATORS: Record<string, ValidatorFn[]> = {
  document: [numericValidator],
  phone: [phoneValidator],
};

export function applyRequiredValidators(
  group: FormGroup,
  keys: string[],
  formatValidators: Record<string, ValidatorFn[]>,
  required: boolean,
): void {
  keys.forEach((key) => {
    const control = group.get(key);
    if (!control) return;
    const format = formatValidators[key] ?? [];
    control.setValidators(required ? [Validators.required, ...format] : format);
    control.updateValueAndValidity({ emitEvent: false });
  });
  group.updateValueAndValidity({ emitEvent: false });
}

export const PATIENT_ERROR_RULES = {
  document: [
    ['required', 'El número de documento es requerido'],
    ['invalidNumeric', 'Solo se permiten números'],
  ],
  firstName: [['required', 'El nombre es requerido']],
  lastName: [['required', 'El apellido es requerido']],
  birthDate: [
    ['required', 'La fecha de nacimiento es requerida'],
    ['dateInFuture', 'La fecha no puede ser mayor a la actual'],
  ],
  disability: [
    ['required', 'La discapacidad es requerida'],
    ['invalidDisability', 'Ingrese SÍ o NO'],
  ],
  phone: [['invalidPhone', 'Ingrese un teléfono válido']],
  email: [['email', 'Ingrese un correo válido']],
} satisfies Record<string, [string, string][]>;

export const COMPANION_ERROR_RULES = {
  firstName: [['required', 'El nombre es requerido']],
  lastName: [['required', 'El apellido es requerido']],
  document: [
    ['required', 'El documento es requerido'],
    ['invalidNumeric', 'Solo se permiten números'],
  ],
  address: [['required', 'La dirección es requerida']],
  phone: [
    ['required', 'El teléfono es requerido'],
    ['invalidPhone', 'Ingrese un teléfono válido'],
  ],
} satisfies Record<string, [string, string][]>;

export const ADMISSION_ERROR_RULES = {
  observations: [['required', 'Las observaciones son requeridas']],
} satisfies Record<string, [string, string][]>;

export const AUTH_ERROR_RULES = {
  authNumber: [['required', 'El número de autorización es requerido']],
  feeScheduleId: [['required', 'Seleccione el tarifario']],
  mapiissCode: [['required', 'Seleccione el código MAPIISS con la lupa de búsqueda']],
  quantity: [
    ['required', 'La cantidad es requerida'],
    ['invalidNumeric', 'Solo se permiten números'],
    ['min', 'La cantidad mínima es 1'],
    ['max', 'La cantidad supera el máximo permitido'],
  ],
} satisfies Record<string, [string, string][]>;

export function applyAuthQuantityMax(fg: AuthFormGroup, maxQuantity: number | null): void {
  const validators: ValidatorFn[] = [Validators.required, numericValidator, Validators.min(1)];
  if (maxQuantity !== null && maxQuantity > 0) {
    validators.push(Validators.max(maxQuantity));
  }
  fg.controls.quantity.setValidators(validators);
  fg.controls.quantity.updateValueAndValidity({ emitEvent: false });
}

export function applyAuthCupsSelection(
  fg: AuthFormGroup,
  cups: { code: string; description: string; maxQuantity: number },
): void {
  fg.patchValue({
    mapiissCode: cups.code,
    description: cups.description,
    maxQuantity: cups.maxQuantity,
  });
  applyAuthQuantityMax(fg, cups.maxQuantity);
}

export function clearAuthCupsSelection(fg: AuthFormGroup): void {
  fg.patchValue({ mapiissCode: '', description: '', maxQuantity: null });
  applyAuthQuantityMax(fg, null);
}
