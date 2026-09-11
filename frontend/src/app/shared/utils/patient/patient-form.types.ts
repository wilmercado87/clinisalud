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
