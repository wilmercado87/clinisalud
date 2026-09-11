import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { CreateTriageRequest, CreateTriageResponse } from '@features/triage/models/triage.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TriageService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/triage`;

  createTriage(data: CreateTriageRequest): Observable<CreateTriageResponse> {
    return this.http.post<CreateTriageResponse>(this.apiUrl, data);
  }
}
