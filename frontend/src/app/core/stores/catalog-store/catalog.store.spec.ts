import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { CatalogStore } from './catalog.store';
import { CatalogItemResponse } from '@core/models/catalog.model';

describe('CatalogStore', () => {
  let store: CatalogStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(CatalogStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads all beds from the server without filtering by status', async () => {
    const promise = firstValueFrom(store.loadCatalog('beds'));
    const req = httpMock.expectOne((r) => r.url.endsWith('/catalogs/beds'));
    expect(req.request.params.has('status')).toBe(false);
    expect(req.request.params.get('pageSize')).toBe('100');
    expect(req.request.headers.get('Cache-Control')).toBe('no-cache');

    req.flush({
      items: [
        { roomId: 1, bedCode: 'HAB101', bedStatus: 1, tipoCama: 'hospitalizado' },
        { roomId: 2, bedCode: 'HAB102', bedStatus: 0, tipoCama: 'hospitalizado' },
      ],
      total: 2,
    });

    expect(await promise).toEqual([
      { roomId: 1, bedCode: 'HAB101', bedStatus: 1, tipoCama: 'hospitalizado' },
      { roomId: 2, bedCode: 'HAB102', bedStatus: 0, tipoCama: 'hospitalizado' },
    ]);
  });

  it('clearCache resets cache, observables and versions', async () => {
    const initial = firstValueFrom(store.loadCatalog('authorization-types'));
    httpMock
      .expectOne((r) => r.url.endsWith('/catalogs/authorization-types'))
      .flush([{ id: 1, name: 'Tipo', description: 'Tipo' } satisfies CatalogItemResponse]);
    await initial;

    const reloadReq = firstValueFrom(store.reloadCatalog('authorization-types'));
    httpMock
      .expectOne((r) => r.url.endsWith('/catalogs/authorization-types'))
      .flush([{ id: 1, name: 'Tipo', description: 'Tipo' } satisfies CatalogItemResponse]);
    await reloadReq;
    expect(store.versionOf('authorization-types')).toBe(1);

    store.clearCache();

    expect(store.getCatalog('authorization-types')).toEqual([]);
    expect(store.versionOf('authorization-types')).toBe(0);
  });

  it('reloadCatalog refetches from the server bypassing the cache', async () => {
    const initial = firstValueFrom(store.loadCatalog('authorization-types'));
    const initialReq = httpMock.expectOne((r) => r.url.endsWith('/catalogs/authorization-types'));
    expect(initialReq.request.headers.get('Cache-Control')).toBe('no-cache');
    initialReq.flush([{ id: 1, name: 'Viejo', description: 'Viejo' } satisfies CatalogItemResponse]);
    expect(await initial).toEqual([{ id: 1, name: 'Viejo', description: 'Viejo' }]);

    const reload = firstValueFrom(store.reloadCatalog('authorization-types'));
    const req = httpMock.expectOne((r) => r.url.endsWith('/catalogs/authorization-types'));
    expect(req.request.headers.has('Cache-Control')).toBe(true);

    req.flush([
      { id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 } satisfies CatalogItemResponse,
    ]);
    expect(await reload).toEqual([
      { id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 },
    ]);
    expect(store.getCatalog('authorization-types')).toEqual([
      { id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 },
    ]);
    expect(store.versionOf('authorization-types')).toBe(1);
  });
});