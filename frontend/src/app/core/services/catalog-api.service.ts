import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  CatalogItem,
  MunicipioItem,
  ContratoItem,
  CamaItem,
  DiagnosticoItem,
  CupsItem,
} from '@core/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/catalogs`;

  getCatalog(type: string): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.apiUrl}/${type}`);
  }

  getMunicipalities(departmentId?: string): Observable<MunicipioItem[]> {
    let params = new HttpParams();
    if (departmentId) params = params.set('departmentId', departmentId);
    return this.http.get<MunicipioItem[]>(`${this.apiUrl}/municipalities`, { params });
  }

  getContracts(epsId?: number): Observable<ContratoItem[]> {
    let params = new HttpParams();
    if (epsId !== undefined) params = params.set('epsId', epsId);
    return this.http.get<ContratoItem[]>(`${this.apiUrl}/contracts`, { params });
  }

  getBeds(bedStatus?: number): Observable<CamaItem[]> {
    let params = new HttpParams();
    if (bedStatus !== undefined) params = params.set('status', bedStatus);
    return this.http.get<CamaItem[]>(`${this.apiUrl}/beds`, { params });
  }

  searchDiagnostics(q: string): Observable<DiagnosticoItem[]> {
    return this.http.get<DiagnosticoItem[]>(`${this.apiUrl}/diagnostics/search`, {
      params: new HttpParams().set('q', q),
    });
  }

  searchCups(q: string): Observable<CupsItem[]> {
    return this.http.get<CupsItem[]>(`${this.apiUrl}/cups/search`, {
      params: new HttpParams().set('q', q),
    });
  }
}
