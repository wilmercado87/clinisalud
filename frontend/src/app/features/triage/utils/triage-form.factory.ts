import { FormGroup, Validators } from '@angular/forms';
import { createFormControl } from '@shared/utils/form-control';
import { TriageForm } from './triage-form.types';

export const TRIAGE_KEYS = ['priorityTypeId', 'epsId', 'diagnosticId'];

export function createTriageForm(): TriageForm {
  return new FormGroup({
    priorityTypeId: createFormControl<number | null>(null, Validators.required),
    epsId: createFormControl<number | null>(null, Validators.required),
    diagnosticId: createFormControl<number | null>(null, Validators.required),
  });
}
