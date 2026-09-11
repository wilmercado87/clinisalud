import { FormGroup, Validators } from '@angular/forms';
import { createFormControl } from '@shared/utils/form-control';
import { numericValidator, phoneValidator } from '@shared/utils/form-validators';
import { AdmissionForm, CompanionForm } from './admission-form.types';

export const ADMISSION_KEYS = ['epsId', 'roomId', 'observations'];

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
