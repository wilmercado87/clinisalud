import { FormControl, FormGroup } from '@angular/forms';

export type FormMode = 'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND';

export type PatientForm = FormGroup<{
  documentTypeId: FormControl<number | null>;
  document: FormControl<string>;
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  birthDate: FormControl<Date | null>;
  genderId: FormControl<number | null>;
  age: FormControl<string>;
  disability: FormControl<string>;
  userTypeId: FormControl<number | null>;
  address: FormControl<string>;
  phone: FormControl<string>;
  email: FormControl<string>;
}>;

export type PatientFormValue = {
  documentTypeId: number | null;
  document: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  genderId: number | null;
  age: string;
  disability: string;
  userTypeId: number | null;
  address: string;
  phone: string;
  email: string;
};

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

export type AuthFormGroup = FormGroup<{
  authTypeId: FormControl<number | null>;
  authNumber: FormControl<string>;
  mapiissCode: FormControl<string>;
  quantity: FormControl<number | null>;
}>;
