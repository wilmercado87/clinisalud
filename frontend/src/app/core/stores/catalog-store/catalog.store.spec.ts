import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
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

  it('loads only available beds from the server', async () => {
    const promise = firstValueFrom(store.loadCatalog('beds'));
    const req = httpMock.expectOne((r) => r.url.endsWith('/catalogs/beds'));
    expect(req.request.params.get('status')).toBe('0');
    expect(req.request.params.get('pageSize')).toBe('100');

    req.flush({
      items: [
        { roomId: 1, bedCode: 'HAB101', bedStatus: 1, tipoCama: 'hospitalizado' },
        { roomId: 2, bedCode: 'HAB102', bedStatus: 0, tipoCama: 'hospitalizado' },
      ],
      total: 2,
    });

    expect(await promise).toEqual([
      { roomId: 2, bedCode: 'HAB102', bedStatus: 0, tipoCama: 'hospitalizado' },
    ]);
  });
});