import { AbstractControl, ValidationErrors } from '@angular/forms';
import { isBlank } from './form-validators';

export interface PasswordCriterion {
  key: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_CRITERIA: PasswordCriterion[] = [
  { key: 'minLength', label: 'Mínimo 8 caracteres', test: (value) => value.length >= 8 },
  {
    key: 'alphanumeric',
    label: 'Debe ser alfanumérico',
    test: (value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value),
  },
  { key: 'uppercase', label: 'Mínimo una mayúscula', test: (value) => /[A-Z]/.test(value) },
  { key: 'lowercase', label: 'Mínimo una minúscula', test: (value) => /[a-z]/.test(value) },
  { key: 'special', label: 'Mínimo un carácter especial', test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  if (isBlank(value)) return null;
  return PASSWORD_CRITERIA.every((criterion) => criterion.test(value)) ? null : { invalidPassword: true };
}
