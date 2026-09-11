import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { parseIsoDateString, toIsoDateString } from '@shared/utils/form-validators';

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

export function toApiBirthDate(value: Date | string | null): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? toIsoDateString(value) : value;
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
