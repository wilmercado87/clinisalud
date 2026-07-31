import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { CatalogService } from '@core/services/catalog.service';
import { CatalogItem, MunicipioItem, ContratoItem, CamaItem, DiagnosticoItem, CupsItem } from '@core/models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly catalogApi = inject(CatalogService);

  private cache = new Map<string, CatalogItem[]>();
  private observables = new Map<string, Observable<CatalogItem[]>>();

  getCatalog(type: string): CatalogItem[] {
    return this.cache.get(type) ?? [];
  }

  loadCatalog(type: string): Observable<CatalogItem[]> {
    const cached = this.cache.get(type);
    if (cached) return of(cached);

    if (!this.observables.has(type)) {
      const source: Observable<any[]> = type === 'beds'
        ? this.catalogApi.getBeds(0)
        : this.catalogApi.getCatalog(type);
      this.observables.set(
        type,
        source.pipe(
          tap((items) => this.cache.set(type, items)),
          shareReplay(1),
        ),
      );
    }

    return this.observables.get(type)!;
  }

  private readonly searchDiagTrigger = signal<string | null>(null);

  private readonly diagnosticsResource = rxResource({
    request: () => this.searchDiagTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogApi.searchDiagnostics(request);
    },
  });

  readonly diagnostics = this.diagnosticsResource.value.asReadonly();
  readonly isSearchingDiagnostics = this.diagnosticsResource.isLoading;
  readonly diagnosticsError = this.diagnosticsResource.error;

  private readonly searchCupsTrigger = signal<string | null>(null);

  private readonly cupsResource = rxResource({
    request: () => this.searchCupsTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogApi.searchCups(request);
    },
  });

  readonly cups = this.cupsResource.value.asReadonly();
  readonly isSearchingCups = this.cupsResource.isLoading;
  readonly cupsError = this.cupsResource.error;

  private readonly municipalitiesTrigger = signal<{ departmentId?: string } | null>(null);

  private readonly municipalitiesResource = rxResource({
    request: () => this.municipalitiesTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogApi.getMunicipalities(request.departmentId);
    },
  });

  readonly municipalities = this.municipalitiesResource.value.asReadonly();
  readonly isLoadingMunicipalities = this.municipalitiesResource.isLoading;
  readonly municipalitiesError = this.municipalitiesResource.error;

  private readonly contractsTrigger = signal<{ epsId?: number } | null>(null);

  private readonly contractsResource = rxResource({
    request: () => this.contractsTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogApi.getContracts(request.epsId);
    },
  });

  readonly contracts = this.contractsResource.value.asReadonly();
  readonly isLoadingContracts = this.contractsResource.isLoading;
  readonly contractsError = this.contractsResource.error;

  searchDiagnostics(q: string): void {
    this.searchDiagTrigger.set(q || null);
  }

  searchCups(q: string): void {
    this.searchCupsTrigger.set(q || null);
  }

  loadMunicipalities(departmentId?: string): void {
    this.municipalitiesTrigger.set({ departmentId });
  }

  loadContracts(epsId?: number): void {
    this.contractsTrigger.set({ epsId });
  }

  clearCache(): void {
    this.cache.clear();
    this.observables.clear();
    this.searchDiagTrigger.set(null);
    this.searchCupsTrigger.set(null);
    this.municipalitiesTrigger.set(null);
    this.contractsTrigger.set(null);
  }
}
