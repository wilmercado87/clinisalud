import { CreateTriageRequest } from '@features/triage/models/triage.model';
import { setControlEnabled } from '@shared/utils/form-control';
import { PATIENT_DATA_KEYS } from '@shared/utils/patient/patient-form.factory';
import { toApiBirthDate } from '@shared/utils/patient/patient.mapper';
import { FormMode, PatientForm, PatientFormValue } from '@shared/utils/patient/patient-form.types';
import { TriageForm, TriageFormValue } from './triage-form.types';
import { TRIAGE_KEYS } from './triage-form.factory';

export function buildTriageRequest(params: {
  isNewPatient: boolean;
  patient: PatientFormValue;
  triage: TriageFormValue;
}): CreateTriageRequest {
  const { isNewPatient, patient, triage } = params;

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
    priorityTypeId: triage.priorityTypeId ?? 0,
    epsId: triage.epsId ?? 0,
    diagnosticId: triage.diagnosticId ?? 0,
  };
}

export function applyTriageFormState(
  forms: { patient: PatientForm; triage: TriageForm },
  mode: FormMode,
): void {
  const searchEnabled = mode === 'IDLE' || mode === 'NOT_FOUND';

  setControlEnabled(forms.patient, 'documentTypeId', searchEnabled);
  setControlEnabled(forms.patient, 'document', searchEnabled);

  const dataEnabled = mode === 'NOT_FOUND';
  PATIENT_DATA_KEYS.forEach((key) => setControlEnabled(forms.patient, key, dataEnabled));

  const triageEnabled = mode === 'FOUND' || mode === 'NOT_FOUND';
  TRIAGE_KEYS.forEach((key) => setControlEnabled(forms.triage, key, triageEnabled));
}
