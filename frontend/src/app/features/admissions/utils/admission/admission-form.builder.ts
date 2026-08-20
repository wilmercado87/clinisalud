import { FormGroup } from '@angular/forms';
import {
  AuthorizationData,
  CompanionData,
  CreateAdmissionRequest,
  UpdateAdmissionRequest,
} from '@features/admissions/models/admissions.model';
import { isBlank, toIsoDateString } from '@shared/utils/form-validators';
import { AuthorizationFormGroup } from '../authorization/authorization-form.types';
import { ADMISSION_KEYS, PATIENT_DATA_KEYS } from './admission-form.factory';
import {
  AdmissionForm,
  AdmissionFormValue,
  CompanionForm,
  CompanionFormValue,
  FormMode,
  PatientForm,
  PatientFormValue,
} from './admission-form.types';

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
  authForms: AuthorizationFormGroup[],
  enabled: boolean,
): AuthorizationData[] | undefined {
  if (!enabled) return undefined;
  return authForms.map((fg) => ({
    authTypeId: fg.controls.authTypeId.value ?? 0,
    authNumber: fg.controls.authNumber.value,
    mapiissCode: fg.controls.mapiissCode.value,
    feeScheduleId: fg.controls.feeScheduleId.value ?? 0,
    quantity: fg.controls.quantity.value ?? 1,
  }));
}

export function buildAdmissionRequest(params: {
  isNewPatient: boolean;
  patient: PatientFormValue;
  admission: AdmissionFormValue;
  companion: CompanionFormValue;
  authForms: AuthorizationFormGroup[];
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
    email: patient.email ?? undefined,
    epsId: admission.epsId ?? 0,
    roomId: admission.roomId ?? undefined,
    observations: admission.observations || undefined,
    companion: buildCompanionRequest(companion),
    authorizations: buildAuthorizationsRequest(authForms, authorizationsEnabled),
  };
}

export function buildUpdateAdmissionRequest(params: {
  roomId: number | null;
  previousRoomId: number | null;
  observations?: string | null;
  previousObservations?: string | null;
  authForms: AuthorizationFormGroup[];
  authorizationsEnabled: boolean;
}): UpdateAdmissionRequest {
  const { roomId, previousRoomId, observations, previousObservations, authForms, authorizationsEnabled } = params;

  const request: UpdateAdmissionRequest = {};
  if (roomId && roomId !== previousRoomId) {
    request.roomId = roomId;
  }
  if ((observations ?? '') !== (previousObservations ?? '')) {
    request.observations = observations ?? '';
  }
  const authorizations = buildAuthorizationsRequest(authForms, authorizationsEnabled);
  if (authorizations?.length) {
    request.authorizations = authorizations;
  }
  return request;
}

export function hasPendingAdmissionChanges(params: {
  roomId: number | null;
  currentRoomId: number | null;
  observations: string;
  currentObservations: string;
}): boolean {
  const { roomId, currentRoomId, observations, currentObservations } = params;
  if (roomId && roomId !== currentRoomId) return true;
  return observations !== currentObservations;
}

export function applyAdmissionFormState(
  forms: { patient: PatientForm; companion: CompanionForm; admission: AdmissionForm },
  mode: FormMode,
  hasActiveAdmission: boolean,
): void {
  const searchEnabled = mode === 'IDLE' || mode === 'NOT_FOUND';
  const dataEnabled = mode === 'NOT_FOUND' || mode === 'FOUND';
  const updateOnly = mode === 'FOUND' && hasActiveAdmission;

  setControl(forms.patient, 'documentTypeId', searchEnabled);
  setControl(forms.patient, 'document', searchEnabled);

  PATIENT_DATA_KEYS.forEach((key) => setControl(forms.patient, key, dataEnabled && !updateOnly));

  Object.keys(forms.companion.controls).forEach((key) => setControl(forms.companion, key, dataEnabled && !updateOnly));

  ADMISSION_KEYS.forEach((key) => setControl(forms.admission, key, dataEnabled && !updateOnly));

  if (updateOnly) {
    setControl(forms.admission, 'roomId', true);
  }
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
