import { FormGroup, Validators } from '@angular/forms';
import { createFormControl } from '@shared/utils/form-control';
import { numericValidator } from '@shared/utils/form-validators';
import { AuthorizationFormGroup } from './authorization-form.types';

export function createAuthorizationForm(): AuthorizationFormGroup {
  const mapiissDescription = createFormControl<string>('');
  mapiissDescription.disable();
  const maxQuantity = createFormControl<number | null>(null);
  maxQuantity.disable();
  return new FormGroup({
    authTypeId: createFormControl<number | null>(null, Validators.required),
    authNumber: createFormControl<string>('', Validators.required),
    feeScheduleId: createFormControl<number | null>(null, Validators.required),
    mapiissCode: createFormControl<string>('', Validators.required),
    quantity: createFormControl<number | null>(1, Validators.required, numericValidator, Validators.min(1)),
    mapiissDescription,
    maxQuantity,
  });
}
