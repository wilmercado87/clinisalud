import { FormGroup, Validators } from '@angular/forms';
import { createFormControl } from '@shared/utils/form-control';
import {
  ageValidator,
  disabilityValidator,
  maxDateValidator,
  numericValidator,
  phoneValidator,
} from '@shared/utils/form-validators';
import { AdmissionForm, CompanionForm, PatientForm } from './admission-form.types';

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

export const ADMISSION_KEYS = ['epsId', 'roomId', 'observations'];

export function createPatientForm(today: Date): PatientForm {
  return new FormGroup({
    documentTypeId: createFormControl<number | null>(null, Validators.required),
    document: createFormControl<string>('', Validators.required, numericValidator),
    firstName: createFormControl<string>(''),
    lastName: createFormControl<string>(''),
    birthDate: createFormControl<Date | null>(null, maxDateValidator(today)),
    genderId: createFormControl<number | null>(null),
    age: createFormControl<string>('', ageValidator),
    disability: createFormControl<string>('', disabilityValidator),
    userTypeId: createFormControl<number | null>(null),
    address: createFormControl<string>(''),
    phone: createFormControl<string>('', phoneValidator),
    email: createFormControl<string>('', Validators.email),
  });
}

export function createCompanionForm(): CompanionForm {
  return new FormGroup({
    firstName: createFormControl<string>(''),
    lastName: createFormControl<string>(''),
    documentTypeId: createFormControl<number | null>(null),
    document: createFormControl<string>('', numericValidator),
    address: createFormControl<string>(''),
    relationshipId: createFormControl<number | null>(null),
    phone: createFormControl<string>('', phoneValidator),
  });
}

export function createAdmissionForm(): AdmissionForm {
  return new FormGroup({
    epsId: createFormControl<number | null>(null, Validators.required),
    roomId: createFormControl<number | null>(null),
    observations: createFormControl<string>('', Validators.required),
  });
}
