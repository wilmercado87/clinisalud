import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  AdmissionStateResponse,
  CensusRowResponse,
  CreateAdmissionRequest,
  CreateAdmissionResponse,
  DischargeAdmissionResponse,
  PatientLookupRequest,
  PatientLookupResponse,
  UpdateAdmissionRequest,
  UpdateAdmissionResponse,
} from '@features/admissions/models/admissions.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admissions`;

  lookupPatient(request: PatientLookupRequest): Observable<PatientLookupResponse> {
    const params = new HttpParams().set('documentTypeId', request.documentTypeId).set('document', request.document);
    return this.http.get<PatientLookupResponse>(`${this.apiUrl}/patient-lookup`, { params });
  }

  getAdmissionByNumber(admissionNumber: string): Observable<PatientLookupResponse> {
    return this.http.get<PatientLookupResponse>(`${this.apiUrl}/${admissionNumber}`);
  }

  createAdmission(data: CreateAdmissionRequest): Observable<CreateAdmissionResponse> {
    return this.http.post<CreateAdmissionResponse>(this.apiUrl, data);
  }

  getCensus(): Observable<CensusRowResponse[]> {
    return this.http.get<CensusRowResponse[]>(`${this.apiUrl}/census`);
  }

  dischargeAdmission(admissionNumber: string): Observable<DischargeAdmissionResponse> {
    return this.http.post<DischargeAdmissionResponse>(`${this.apiUrl}/${admissionNumber}/discharge`, {});
  }

  updateAdmissionState(admissionNumber: string, state: string): Observable<AdmissionStateResponse> {
    return this.http.patch<AdmissionStateResponse>(`${this.apiUrl}/${admissionNumber}/state`, { state });
  }

  updateAdmission(admissionNumber: string, data: UpdateAdmissionRequest): Observable<UpdateAdmissionResponse> {
    return this.http.patch<UpdateAdmissionResponse>(`${this.apiUrl}/${admissionNumber}`, data);
  }
}
