import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BedsPageResponse,
  CatalogItemResponse,
  ContratoResponse,
  CupsPageResponse,
  DiagnosticoResponse,
  MunicipioResponse,
} from '@core/models/catalog.model';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogs`;

  private readonly noCacheHeaders = new HttpHeaders({ 'Cache-Control': 'no-cache' });

  getCatalog(type: string): Observable<CatalogItemResponse[]> {
    return this.http.get<CatalogItemResponse[]>(`${this.apiUrl}/${type}`, {
      headers: this.noCacheHeaders,
    });
  }

  getMunicipalities(departmentId?: string): Observable<MunicipioResponse[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<MunicipioResponse[]>(`${this.apiUrl}/municipalities`, {
      headers: this.noCacheHeaders,
      params,
    });
  }

  getContracts(epsId?: number): Observable<ContratoResponse[]> {
    let params = new HttpParams();
    if (epsId !== undefined) params = params.set('epsId', epsId);
    return this.http.get<ContratoResponse[]>(`${this.apiUrl}/contracts`, {
      headers: this.noCacheHeaders,
      params,
    });
  }

  getBeds(bedStatus?: number, pageSize?: number): Observable<BedsPageResponse> {
    let params = new HttpParams();
    if (bedStatus !== undefined) params = params.set('status', bedStatus);
    if (pageSize !== undefined) params = params.set('pageSize', pageSize);
    return this.http.get<BedsPageResponse>(`${this.apiUrl}/beds`, {
      headers: this.noCacheHeaders,
      params,
    });
  }

  searchDiagnostics(q: string): Observable<DiagnosticoResponse[]> {
    return this.http.get<DiagnosticoResponse[]>(`${this.apiUrl}/diagnostics/search`, {
      headers: this.noCacheHeaders,
      params: new HttpParams().set('q', q),
    });
  }

  searchCups(
    q: string,
    feeScheduleId: number,
    page = 1,
    pageSize = 20,
    attentionLevelId?: number,
  ): Observable<CupsPageResponse> {
    let params = new HttpParams()
      .set('q', q)
      .set('feeScheduleId', feeScheduleId)
      .set('page', page)
      .set('pageSize', pageSize);
    if (attentionLevelId !== undefined) params = params.set('attentionLevelId', attentionLevelId);
    return this.http.get<CupsPageResponse>(`${this.apiUrl}/cups/search`, {
      headers: this.noCacheHeaders,
      params,
    });
  }
}
