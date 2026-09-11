import { FormGroup, ValidatorFn } from '@angular/forms';
import { numericValidator, phoneValidator } from '@shared/utils/form-validators';

export const COMPANION_REQUIRED_KEYS = [
  'firstName',
  'lastName',
  'documentTypeId',
  'document',
  'address',
  'relationshipId',
  'phone',
];

export const COMPANION_FORMAT_VALIDATORS: Record<string, ValidatorFn[]> = {
  document: [numericValidator],
  phone: [phoneValidator],
};

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
