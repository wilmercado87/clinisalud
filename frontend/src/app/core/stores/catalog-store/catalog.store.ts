import { Injectable, inject } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { CatalogApiService, CatalogItem } from '@core/services/catalog-api.service';

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  private readonly catalogApi = inject(CatalogApiService);

  private cache = new Map<string, CatalogItem[]>();
  private observables = new Map<string, Observable<CatalogItem[]>>();

  getCatalog(type: string): CatalogItem[] {
    return this.cache.get(type) ?? [];
  }

  loadCatalog(type: string): Observable<CatalogItem[]> {
    const cached = this.cache.get(type);
    if (cached) return of(cached);

    if (!this.observables.has(type)) {
      this.observables.set(
        type,
        this.catalogApi.getCatalog(type).pipe(
          tap((items) => this.cache.set(type, items)),
          shareReplay(1),
        ),
      );
    }

    return this.observables.get(type)!;
  }

  clearCache(): void {
    this.cache.clear();
    this.observables.clear();
  }
}
