// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (búsqueda de CUPS)
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import {
  CupsSearchDialogComponent,
  CupsSearchDialogData,
} from './cups-search-dialog.component';
import { CatalogService } from '@core/services/catalog.service';
import { CupsPageResponse } from '@core/models/catalog.model';

describe('CupsSearchDialogComponent', () => {
  let fixture: ComponentFixture<CupsSearchDialogComponent>;
  let component: CupsSearchDialogComponent;
  let apiService: {
    searchCups: jasmine.Spy;
  };
  let dialogRef: { close: jasmine.Spy };

  const firstPage: CupsPageResponse = {
    items: [
      { id: 1, code: '123', description: 'Consulta', maxQuantity: 3, netValue: 100 },
      { id: 2, code: '456', description: 'Procedimiento', maxQuantity: 1, netValue: 200 },
    ],
    total: 3,
  };
  const secondPage: CupsPageResponse = {
    items: [{ id: 3, code: '789', description: 'Cirugía', maxQuantity: 2, netValue: 300 }],
    total: 3,
  };

  beforeEach(() => {
    apiService = {
      searchCups: jasmine
        .createSpy('searchCups')
        .and.callFake((_q: string, feeScheduleId: number, page: number) =>
          of(page === 1 ? firstPage : secondPage),
        ),
    };
    dialogRef = { close: jasmine.createSpy('close') };

    TestBed.configureTestingModule({
      imports: [CupsSearchDialogComponent],
      providers: [
        { provide: CatalogService, useValue: apiService },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { feeScheduleId: 2, feeScheduleName: 'ISS 2001' } satisfies CupsSearchDialogData,
        },
      ],
    });

    fixture = TestBed.createComponent(CupsSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not search with fewer than 3 characters', fakeAsync(() => {
    const control = component.termControl;
    control.setValue('ab');
    tick(350);

    expect(apiService.searchCups).not.toHaveBeenCalled();
    expect(component.items()).toEqual([]);
  }));

  it('searches with fee schedule when the term has 3 or more chars', fakeAsync(() => {
    const control = component.termControl;
    control.setValue('123');
    tick(350);

    expect(apiService.searchCups).toHaveBeenCalledWith('123', 2, 1, 20);
    expect(component.items().length).toBe(2);
    expect(component.total()).toBe(3);
  }));

  it('loads the next page on demand', fakeAsync(() => {
    const control = component.termControl;
    control.setValue('consulta');
    tick(350);
    expect(component.hasMore()).toBeTrue();

    component.loadMore();
    tick();

    expect(apiService.searchCups).toHaveBeenCalledWith('consulta', 2, 2, 20);
    expect(component.items().length).toBe(3);
    expect(component.hasMore()).toBeFalse();
  }));

  it('shows an error message when the request fails', fakeAsync(() => {
    apiService.searchCups.and.returnValue(
      throwError(() => new Error('network')),
    );
    const control = component.termControl;
    control.setValue('fallo');
    tick(350);

    expect(component.error()).not.toBeNull();
  }));

  it('closes the dialog with the selected CUPS', () => {
    component.selectCups(firstPage.items[0]);
    expect(dialogRef.close).toHaveBeenCalledWith(firstPage.items[0]);
  });

  it('closes the dialog without a value on cancel', () => {
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});