import { FormControl, FormGroup } from '@angular/forms';

export type AuthorizationFormGroup = FormGroup<{
  authTypeId: FormControl<number | null>;
  authNumber: FormControl<string>;
  feeScheduleId: FormControl<number | null>;
  mapiissCode: FormControl<string>;
  quantity: FormControl<number | null>;
  description: FormControl<string>;
  maxQuantity: FormControl<number | null>;
}>;

export type AuthorizationFormValue = {
  authTypeId: number | null;
  authNumber: string;
  feeScheduleId: number | null;
  mapiissCode: string;
  quantity: number | null;
  description: string;
  maxQuantity: number | null;
};

export type AuthorizationEntryError = {
  authTypeId?: string;
  authNumber?: string;
  feeScheduleId?: string;
  mapiissCode?: string;
  quantity?: string;
};

export interface AuthorizationIdentity {
  authTypeId: number | null;
  authNumber: string;
  feeScheduleId: number | null;
  mapiissCode: string;
}
