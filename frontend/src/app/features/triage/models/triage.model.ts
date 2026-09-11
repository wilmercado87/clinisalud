export interface CreateTriageRequest {
  isNewPatient: boolean;
  documentTypeId: number;
  document: string;
  priorityTypeId: number;
  epsId: number;
  diagnosticId: number;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  genderId?: number;
  age?: string;
  disability?: string;
  userTypeId?: number;
  address?: string;
  phone?: string;
  email?: string;
}

export interface TriageResponse {
  id: number;
  priorityTypeId: number;
  pacienteId: number;
  attentionDate: string;
  epsId: number;
  diagnosticId: number;
  systemUserId: number;
}

export interface CreateTriageResponse {
  triage: TriageResponse;
  patient: { id: number; documentTypeId: number; document: string };
}
