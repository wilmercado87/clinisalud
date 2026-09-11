import { FormGroup, Validators } from '@angular/forms';
import { createFormControl } from '@shared/utils/form-control';
import {
  disabilityValidator,
  maxDateValidator,
  numericValidator,
  phoneValidator,
} from '@shared/utils/form-validators';
import { PatientForm } from './patient-form.types';

export const PATIENT_DATA_KEYS = [
  'firstName',
  'lastName',
  'birthDate',
  'genderId',
  'age',
  'disability',
  'userTypeId',
  'address',
  'phone',
  'email',
];

export function createPatientForm(today: Date): PatientForm {
  return new FormGroup({
    documentTypeId: createFormControl<number | null>(null, Validators.required),
    document: createFormControl<string>('', Validators.required, numericValidator),
    firstName: createFormControl<string>(''),
    lastName: createFormControl<string>(''),
    birthDate: createFormControl<Date | null>(null, maxDateValidator(today)),
    genderId: createFormControl<number | null>(null),
    age: createFormControl<string>(''),
    disability: createFormControl<string>('', disabilityValidator),
    userTypeId: createFormControl<number | null>(null),
    address: createFormControl<string>(''),
    phone: createFormControl<string>('', phoneValidator),
    email: createFormControl<string>('', Validators.email),
  });
}
