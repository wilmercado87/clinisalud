import { FormGroup } from '@angular/forms';
import { isBlank, toIsoDateString } from '@shared/utils/form-validators';
import {
  AuthorizationData,
  CompanionData,
  CreateAdmissionRequest,
} from '@features/admissions/models/admissions.model';
import {
  AdmissionForm,
  AdmissionFormValue,
  AuthFormGroup,
  CompanionForm,
  CompanionFormValue,
  FormMode,
  PatientForm,
  PatientFormValue,
} from './admission-form.types';
import { ADMISSION_KEYS, PATIENT_DATA_KEYS } from './admission-form.factory';

export function toApiBirthDate(value: Date | string | null): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? toIsoDateString(value) : value;
}

export function buildCompanionRequest(value: CompanionFormValue): CompanionData | undefined {
  const hasCompanion = Object.values(value).some((v) => !isBlank(v));
  if (!hasCompanion) return undefined;

  return {
    firstName: value.firstName,
    lastName: value.lastName,
    documentTypeId: value.documentTypeId ?? 0,
    document: value.document,
    address: value.address,
    relationshipId: value.relationshipId ?? 0,
    phone: value.phone,
  };
}

export function buildAuthorizationsRequest(
  authForms: AuthFormGroup[],
  enabled: boolean,
): AuthorizationData[] | undefined {
  if (!enabled) return undefined;
  return authForms.map((fg) => ({
    authTypeId: fg.controls.authTypeId.value ?? 0,
    authNumber: fg.controls.authNumber.value,
    mapiissCode: fg.controls.mapiissCode.value,
    quantity: fg.controls.quantity.value ?? 1,
  }));
}

export function buildAdmissionRequest(params: {
  isNewPatient: boolean;
  patient: PatientFormValue;
  admission: AdmissionFormValue;
  companion: CompanionFormValue;
  authForms: AuthFormGroup[];
  authorizationsEnabled: boolean;
}): CreateAdmissionRequest {
  const { isNewPatient, patient, admission, companion, authForms, authorizationsEnabled } = params;

  return {
    isNewPatient,
    documentTypeId: patient.documentTypeId ?? 0,
    document: patient.document,
    firstName: patient.firstName || undefined,
    lastName: patient.lastName || undefined,
    birthDate: toApiBirthDate(patient.birthDate),
    genderId: patient.genderId ?? undefined,
    age: patient.age || undefined,
    disability: patient.disability || undefined,
    userTypeId: patient.userTypeId ?? undefined,
    address: patient.address || undefined,
    phone: patient.phone || undefined,
    email: patient.email || undefined,
    epsId: admission.epsId ?? 0,
    roomId: admission.roomId ?? 0,
    observations: admission.observations || undefined,
    companion: buildCompanionRequest(companion),
    authorizations: buildAuthorizationsRequest(authForms, authorizationsEnabled),
  };
}

export function applyAdmissionFormState(
  forms: { patient: PatientForm; companion: CompanionForm; admission: AdmissionForm },
  mode: FormMode,
): void {
  const searchEnabled = mode === 'IDLE' || mode === 'NOT_FOUND';
  const dataEnabled = mode === 'NOT_FOUND' || mode === 'FOUND';

  setControl(forms.patient, 'documentTypeId', searchEnabled);
  setControl(forms.patient, 'document', searchEnabled);

  PATIENT_DATA_KEYS.forEach((key) => setControl(forms.patient, key, dataEnabled));

  Object.keys(forms.companion.controls).forEach((key) =>
    setControl(forms.companion, key, dataEnabled),
  );

  ADMISSION_KEYS.forEach((key) => setControl(forms.admission, key, dataEnabled));
}

function setControl(group: FormGroup, key: string, enabled: boolean): void {
  const control = group.get(key);
  if (!control) return;
  if (enabled) {
    control.enable({ emitEvent: false });
  } else {
    control.disable({ emitEvent: false });
  }
}
