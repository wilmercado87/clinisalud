import { PatientLookupResponse } from '@features/admissions/models/admissions.model';
import { parseIsoDateString } from '@shared/utils/form-validators';

export interface PatientFormValuePatch {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  genderId: number;
  age: string;
  disability: string;
  userTypeId: number;
  address: string;
  phone: string;
  email: string;
}

export function patientToFormValue(patient: PatientLookupResponse): PatientFormValuePatch {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    birthDate: parseIsoDateString(patient.birthDate) ?? null,
    genderId: patient.genderId,
    age: patient.age,
    disability: patient.disability,
    userTypeId: patient.userTypeId,
    address: patient.address,
    phone: patient.phone,
    email: patient.email ?? '',
  };
}
