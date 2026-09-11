import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientLookupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admissions`;

  lookupPatient(documentTypeId: number, document: string): Observable<PatientLookupResponse> {
    const params = new HttpParams().set('documentTypeId', documentTypeId).set('document', document);
    return this.http.get<PatientLookupResponse>(`${this.apiUrl}/patient-lookup`, { params });
  }
}
