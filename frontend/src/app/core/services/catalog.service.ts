import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CatalogItemResponse,
  MunicipioResponse,
  ContratoResponse,
  CamaResponse,
  BedsPageResponse,
  DiagnosticoResponse,
  CupsResponse,
} from '@core/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogs`;

  getCatalog(type: string): Observable<CatalogItemResponse[]> {
    return this.http.get<CatalogItemResponse[]>(`${this.apiUrl}/${type}`);
  }

  getMunicipalities(departmentId?: string): Observable<MunicipioResponse[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<MunicipioResponse[]>(`${this.apiUrl}/municipalities`, { params });
  }

  getContracts(epsId?: number): Observable<ContratoResponse[]> {
    let params = new HttpParams();
    if (epsId !== undefined) params = params.set('epsId', epsId);
    return this.http.get<ContratoResponse[]>(`${this.apiUrl}/contracts`, { params });
  }

  getBeds(bedStatus?: number): Observable<BedsPageResponse> {
    let params = new HttpParams();
    if (bedStatus !== undefined) params = params.set('status', bedStatus);
    return this.http.get<BedsPageResponse>(`${this.apiUrl}/beds`, { params });
  }

  searchDiagnostics(q: string): Observable<DiagnosticoResponse[]> {
    return this.http.get<DiagnosticoResponse[]>(`${this.apiUrl}/diagnostics/search`, {
      params: new HttpParams().set('q', q),
    });
  }

  searchCups(q: string): Observable<CupsResponse[]> {
    return this.http.get<CupsResponse[]>(`${this.apiUrl}/cups/search`, {
      params: new HttpParams().set('q', q),
    });
  }
}
