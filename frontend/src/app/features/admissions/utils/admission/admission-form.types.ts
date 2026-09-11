import { FormControl, FormGroup } from '@angular/forms';

export type CompanionForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  documentTypeId: FormControl<number | null>;
  document: FormControl<string>;
  address: FormControl<string>;
  relationshipId: FormControl<number | null>;
  phone: FormControl<string>;
}>;

export type CompanionFormValue = {
  firstName: string;
  lastName: string;
  documentTypeId: number | null;
  document: string;
  address: string;
  relationshipId: number | null;
  phone: string;
};

export type AdmissionForm = FormGroup<{
  epsId: FormControl<number | null>;
  roomId: FormControl<number | null>;
  observations: FormControl<string>;
}>;

export type AdmissionFormValue = {
  epsId: number | null;
  roomId: number | null;
  observations: string;
};
