import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CatalogSourceItem, ContratoResponse } from '@core/models/catalog.model';
import { CatalogService } from '@core/services/catalog.service';
import { Observable, map, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly catalogApi = inject(CatalogService);

  private cache = new Map<string, CatalogSourceItem[]>();
  private observables = new Map<string, Observable<CatalogSourceItem[]>>();
  private readonly versions = signal<Record<string, number>>({});

  versionOf(type: string): number {
    return this.versions()[type] ?? 0;
  }

  getCatalog(type: string): CatalogSourceItem[] {
    return this.cache.get(type) ?? [];
  }

  loadCatalog(type: string): Observable<CatalogSourceItem[]> {
    const cached = this.cache.get(type);
    if (cached) return of(cached);

    if (!this.observables.has(type)) {
      const source: Observable<CatalogSourceItem[]> =
        type === 'beds'
          ? this.catalogApi.getBeds(undefined, 100).pipe(map((page) => page.items))
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

  private readonly contractsCache = new Map<number, Observable<ContratoResponse[]>>();

  resolveContracts(epsId: number): Observable<ContratoResponse[]> {
    const cached = this.contractsCache.get(epsId);
    if (cached) return cached;

    const fresh = this.catalogApi.getContracts(epsId).pipe(shareReplay(1));
    this.contractsCache.set(epsId, fresh);
    return fresh;
  }

  searchDiagnostics(q: string): void {
    this.searchDiagTrigger.set(q || null);
  }

  loadMunicipalities(departmentId?: string): void {
    this.municipalitiesTrigger.set({ departmentId });
  }

  invalidateCatalog(type: string): void {
    this.cache.delete(type);
    this.observables.delete(type);
    this.versions.update((v) => ({ ...v, [type]: (v[type] ?? 0) + 1 }));
  }

  reloadCatalog(type: string): Observable<CatalogSourceItem[]> {
    this.cache.delete(type);
    this.observables.delete(type);
    this.versions.update((v) => ({ ...v, [type]: (v[type] ?? 0) + 1 }));

    const fresh = this.catalogApi.getCatalog(type).pipe(
      tap((items) => this.cache.set(type, items)),
      shareReplay(1),
    );
    this.observables.set(type, fresh);
    return fresh;
  }

  clearCache(): void {
    this.cache.clear();
    this.observables.clear();
    this.versions.set({});
    this.contractsCache.clear();
    this.searchDiagTrigger.set(null);
    this.municipalitiesTrigger.set(null);
  }
}
