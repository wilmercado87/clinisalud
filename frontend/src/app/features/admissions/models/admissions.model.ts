export interface PatientLookupRequest {
  documentTypeId: number;
  document: string;
}

export interface CompanionData {
  firstName: string;
  lastName: string;
  documentTypeId: number;
  document: string;
  address: string;
  relationshipId: number;
  phone: string;
}

export interface AuthorizationData {
  authTypeId: number;
  authNumber: string;
  mapiissCode: string;
  quantity?: number;
  feeScheduleId: number;
}

export interface AdmissionAuthorization {
  authTypeId: number;
  authTypeName?: string;
  authNumber: string;
  mapiissCode: string;
  quantity: number;
  feeScheduleId: number;
  mapiissDescription?: string;
}

export interface CreateAdmissionRequest {
  isNewPatient: boolean;
  documentTypeId: number;
  document: string;
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
  epsId: number;
  roomId?: number;
  observations?: string;
  companion?: CompanionData;
  authorizations?: AuthorizationData[];
}

export interface UpdateAdmissionRequest {
  roomId?: number;
  observations?: string;
  authorizations?: AuthorizationData[];
}

export interface UpdateAdmissionResponse {
  admissionNumber: string;
  roomId: number | null;
  observations: string | null;
  authorizations: AdmissionAuthorization[];
}

export interface PatientLookupResponse {
  id: number;
  documentTypeId: number;
  document: string;
  firstName: string;
  lastName: string;
  age: string;
  address: string;
  phone: string;
  email: string | null;
  disability: string;
  userTypeId: number;
  birthDate: string;
  genderId: number;
  epsId: number | null;
  activeAdmission: {
    admissionNumber: string;
    admissionDate: string;
    roomId: number | null;
    observations: string | null;
    authorizations: AdmissionAuthorization[];
  } | null;
  documentType?: { id: number; code: string; description: string } | null;
  gender?: { id: number; description: string } | null;
  userType?: { id: number; name: string } | null;
}

export interface AdmissionResponse {
  admissionNumber: string;
  invoiceNumber: string | null;
  patientId: number;
  admissionDate: string;
  roomId: number | null;
  epsId: number;
  observations: string | null;
  statusId: number;
  systemUserId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAdmissionResponse {
  admissionNumber: string;
  patient: { id: number; documentTypeId: number; document: string };
  admission: AdmissionResponse;
}

export interface DischargeAdmissionResponse {
  admissionNumber: string;
  statusId: number;
  roomId: number | null;
  dischargedAt: string;
}

export interface AdmissionStateResponse {
  admissionNumber: string;
  statusId: number;
  state: string;
}

export const ADMISSION_STATES = {
  REGISTERED: 'REGISTRADA',
  IN_CARE: 'EN_ATENCION',
  WITH_EPICRISIS: 'CON_EPICRISIS',
  BILLED: 'FACTURADA',
  DISCHARGED: 'EGRESADA',
} as const;

export type AdmissionState = (typeof ADMISSION_STATES)[keyof typeof ADMISSION_STATES];

export const ADMISSION_STATE_TRANSITIONS: Record<AdmissionState, AdmissionState | null> = {
  [ADMISSION_STATES.REGISTERED]: ADMISSION_STATES.IN_CARE,
  [ADMISSION_STATES.IN_CARE]: ADMISSION_STATES.WITH_EPICRISIS,
  [ADMISSION_STATES.WITH_EPICRISIS]: ADMISSION_STATES.BILLED,
  [ADMISSION_STATES.BILLED]: null,
  [ADMISSION_STATES.DISCHARGED]: null,
};

export const ADMISSION_STATE_REVERSE_TRANSITIONS: Record<AdmissionState, AdmissionState | null> = {
  [ADMISSION_STATES.REGISTERED]: null,
  [ADMISSION_STATES.IN_CARE]: ADMISSION_STATES.REGISTERED,
  [ADMISSION_STATES.WITH_EPICRISIS]: ADMISSION_STATES.IN_CARE,
  [ADMISSION_STATES.BILLED]: null,
  [ADMISSION_STATES.DISCHARGED]: null,
};

export interface CensusRowResponse {
  admissionNumber: string;
  patient: {
    id: number;
    documentTypeId: number;
    document: string;
    firstName: string;
    lastName: string;
    documentType?: { id: number; code: string; description: string } | null;
  } | null;
  room: { roomId: number; bedCode: string; bedStatus: number; tipoCama: string } | null;
  eps: { idEps: number; epsCode: string; epsName: string } | null;
  admissionDate: string;
  observations: string | null;
  statusId: number;
  state: string;
}
