import { FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  birthDateAgeValidator,
  disabilityValidator,
  maxDateValidator,
  phoneValidator,
} from '@shared/utils/form-validators';

export const AGE_INVALID_MESSAGE = 'Edad no válida (0 a 120 años)';

export const PATIENT_REQUIRED_KEYS = ['firstName', 'lastName', 'birthDate', 'genderId', 'disability', 'userTypeId'];

export function createPatientFormatValidators(today: Date): Record<string, ValidatorFn[]> {
  return {
    birthDate: [maxDateValidator(today), birthDateAgeValidator],
    disability: [disabilityValidator],
    phone: [phoneValidator],
    email: [Validators.email],
  };
}

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
  group.updateValueAndValidity();
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
    ['invalidAge', AGE_INVALID_MESSAGE],
  ],
  disability: [
    ['required', 'La discapacidad es requerida'],
    ['invalidDisability', 'Ingrese SÍ o NO'],
  ],
  phone: [['invalidPhone', 'Ingrese un teléfono válido']],
  email: [['email', 'Ingrese un correo válido']],
} satisfies Record<string, [string, string][]>;
