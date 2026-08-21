import {
  AdmissionAuthorization,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';
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

export function queuedValuesToAuthorizations(values: AuthorizationFormValue[]): AdmissionAuthorization[] {
  return values.map((value) => ({
    authTypeId: value.authTypeId ?? 0,
    authNumber: value.authNumber,
    mapiissCode: value.mapiissCode,
    quantity: value.quantity ?? 1,
    feeScheduleId: value.feeScheduleId ?? 0,
    mapiissDescription: value.mapiissDescription || undefined,
  }));
}
