import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CensusRowResponse,
  CreateAdmissionRequest,
  CreateAdmissionResponse,
  PatientLookupRequest,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';

@Injectable({ providedIn: 'root' })
export class AdmissionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admissions`;

  lookupPatient(request: PatientLookupRequest): Observable<PatientLookupResponse> {
    const params = new HttpParams()
      .set('documentTypeId', request.documentTypeId)
      .set('document', request.document);
    return this.http.get<PatientLookupResponse>(`${this.apiUrl}/patient-lookup`, { params });
  }

  createAdmission(data: CreateAdmissionRequest): Observable<CreateAdmissionResponse> {
    return this.http.post<CreateAdmissionResponse>(this.apiUrl, data);
  }

  getCensus(): Observable<CensusRowResponse[]> {
    return this.http.get<CensusRowResponse[]>(`${this.apiUrl}/census`);
  }
}
