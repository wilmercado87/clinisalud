import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PatientLookupResult {
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
  epsId?: number | null;
  documentType?: { id: number; code: string; description: string };
  gender?: { id: number; code: string; description: string };
  userType?: { id: number; code: string; name: string };
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

export interface CreateAdmissionData {
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
  authorizations?: {
    authTypeId: number;
    authNumber: string;
    mapiissCode: string;
    quantity?: number;
  }[];
}

export interface CreateAdmissionResult {
  admissionNumber: string;
  patient: { id: number; documentTypeId: number; document: string };
  admission: any;
}

export interface AdmissionCensusRow {
  admissionNumber: string;
  patient: any;
  room: any;
  eps: any;
  admissionDate: string;
  observations: string | null;
  statusId: number;
}

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admissions`;

  lookupPatient(documentTypeId: number, document: string): Observable<PatientLookupResult> {
    const params = new HttpParams()
      .set('documentTypeId', documentTypeId)
      .set('document', document);
    return this.http.get<PatientLookupResult>(`${this.apiUrl}/patient-lookup`, { params });
  }

  createAdmission(data: CreateAdmissionData): Observable<CreateAdmissionResult> {
    return this.http.post<CreateAdmissionResult>(this.apiUrl, data);
  }

  getCensus(): Observable<AdmissionCensusRow[]> {
    return this.http.get<AdmissionCensusRow[]>(`${this.apiUrl}/census`);
  }
}
