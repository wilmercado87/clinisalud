import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogItemResponse } from '@core/models/catalog.model';
import { firstValueFrom } from 'rxjs';
import { CatalogStore } from './catalog.store';

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

    req.flush([{ id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 } satisfies CatalogItemResponse]);
    expect(await reload).toEqual([{ id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 }]);
    expect(store.getCatalog('authorization-types')).toEqual([
      { id: 1, name: 'Nuevo', description: 'Nuevo', attentionLevelId: 2 },
    ]);
    expect(store.versionOf('authorization-types')).toBe(1);
  });

  it('resolveContracts queries the EPS contracts once and serves repeats from cache', async () => {
    const first = firstValueFrom(store.resolveContracts(8002514406));
    const req = httpMock.expectOne((r) => r.url.endsWith('/catalogs/contracts') && r.params.get('epsId') === '8002514406');
    req.flush([
      { id: 1, epsId: 8002514406, feeScheduleId: 2, contractNumber: 'CT-1', startDate: '01/01/2026', endDate: '31/12/2026' },
    ]);

    const contracts = await first;
    expect(contracts.length).toBe(1);

    const repeat = await firstValueFrom(store.resolveContracts(8002514406));
    expect(repeat).toEqual(contracts);
    httpMock.expectNone((r) => r.url.endsWith('/catalogs/contracts'));
  });

  it('resolveContracts keeps separate cache entries per EPS', async () => {
    const a = firstValueFrom(store.resolveContracts(111));
    const b = firstValueFrom(store.resolveContracts(222));

    httpMock
      .expectOne((r) => r.params.get('epsId') === '111')
      .flush([{ id: 1, epsId: 111, feeScheduleId: 3, contractNumber: 'A', startDate: '01/01/2026', endDate: '31/12/2026' }]);
    httpMock
      .expectOne((r) => r.params.get('epsId') === '222')
      .flush([{ id: 2, epsId: 222, feeScheduleId: 4, contractNumber: 'B', startDate: '01/01/2026', endDate: '31/12/2026' }]);

    expect((await a)[0].feeScheduleId).toBe(3);
    expect((await b)[0].feeScheduleId).toBe(4);
  });

  it('clearCache drops the contracts cache so the next resolve refetches', async () => {
    const initial = firstValueFrom(store.resolveContracts(8002514406));
    httpMock
      .expectOne((r) => r.params.get('epsId') === '8002514406')
      .flush([{ id: 1, epsId: 8002514406, feeScheduleId: 2, contractNumber: 'CT-1', startDate: '01/01/2026', endDate: '31/12/2026' }]);
    await initial;

    store.clearCache();

    const afterClear = firstValueFrom(store.resolveContracts(8002514406));
    httpMock
      .expectOne((r) => r.params.get('epsId') === '8002514406')
      .flush([]);
    expect(await afterClear).toEqual([]);
  });
});
