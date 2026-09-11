export interface AdmissionAuthorization {
  authTypeId: number;
  authTypeName?: string;
  authNumber: string;
  mapiissCode: string;
  quantity: number;
  feeScheduleId: number;
  mapiissDescription?: string;
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
    statusId?: number;
    state?: string;
    roomId: number | null;
    observations: string | null;
    authorizations: AdmissionAuthorization[];
  } | null;
  documentType?: { id: number; code: string; description: string } | null;
  gender?: { id: number; description: string } | null;
  userType?: { id: number; name: string } | null;
}
