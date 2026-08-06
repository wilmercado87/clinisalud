import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import {
  ageValidator,
  disabilityValidator,
  maxDateValidator,
  numericValidator,
  phoneValidator,
} from '@shared/utils/form-validators';
import {
  AdmissionForm,
  AuthFormGroup,
  CompanionForm,
  PatientForm,
} from './admission-form.types';

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

function createControl<T>(initialValue: T, ...validators: ValidatorFn[]): FormControl<T> {
  return new FormControl<T>(initialValue, {
    nonNullable: true,
    validators: validators.length > 0 ? validators : null,
  });
}

export function createPatientForm(today: Date): PatientForm {
  return new FormGroup({
    documentTypeId: createControl<number | null>(null, Validators.required),
    document: createControl<string>('', Validators.required, numericValidator),
    firstName: createControl<string>(''),
    lastName: createControl<string>(''),
    birthDate: createControl<Date | null>(null, maxDateValidator(today)),
    genderId: createControl<number | null>(null),
    age: createControl<string>('', ageValidator),
    disability: createControl<string>('', disabilityValidator),
    userTypeId: createControl<number | null>(null),
    address: createControl<string>(''),
    phone: createControl<string>('', phoneValidator),
    email: createControl<string>('', Validators.email),
  });
}

export function createCompanionForm(): CompanionForm {
  return new FormGroup({
    firstName: createControl<string>(''),
    lastName: createControl<string>(''),
    documentTypeId: createControl<number | null>(null),
    document: createControl<string>('', numericValidator),
    address: createControl<string>(''),
    relationshipId: createControl<number | null>(null),
    phone: createControl<string>('', phoneValidator),
  });
}

export function createAdmissionForm(): AdmissionForm {
  return new FormGroup({
    epsId: createControl<number | null>(null, Validators.required),
    roomId: createControl<number | null>(null, Validators.required),
    observations: createControl<string>('', Validators.required),
  });
}

export function createAuthEntryForm(): AuthFormGroup {
  const description = createControl<string>('');
  description.disable();
  const maxQuantity = createControl<number | null>(null);
  maxQuantity.disable();
  return new FormGroup({
    authTypeId: createControl<number | null>(null, Validators.required),
    authNumber: createControl<string>('', Validators.required),
    feeScheduleId: createControl<number | null>(null, Validators.required),
    mapiissCode: createControl<string>('', Validators.required),
    quantity: createControl<number | null>(1, Validators.required, numericValidator, Validators.min(1)),
    description,
    maxQuantity,
  });
}
