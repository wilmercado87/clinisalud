// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (búsqueda de CUPS)
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CupsPageResponse } from '@core/models/catalog.model';
import { CatalogService } from '@core/services/catalog.service';
import { of, throwError } from 'rxjs';
import { CupsSearchDialogComponent, CupsSearchDialogData } from './cups-search-dialog.component';

jest.setTimeout(6000);

describe('CupsSearchDialogComponent', () => {
  let fixture: ComponentFixture<CupsSearchDialogComponent>;
  let component: CupsSearchDialogComponent;
  let apiService: {
    searchCups: jest.Mock;
  };
  let dialogRef: { close: jest.Mock };

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

  async function flushSearch(): Promise<void> {
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 30));
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  async function typeTerm(value: string): Promise<void> {
    component.termControl.setValue(value);
    await new Promise<void>((resolve) => setTimeout(resolve, 350));
    await flushSearch();
  }

  beforeEach(() => {
    apiService = {
      searchCups: jest
        .fn()
        .mockImplementation((_q: string, feeScheduleId: number, page: number) =>
          of(page === 1 ? firstPage : secondPage),
        ),
    };
    dialogRef = { close: jest.fn() };

    TestBed.configureTestingModule({
      imports: [CupsSearchDialogComponent],
      providers: [
        { provide: CatalogService, useValue: apiService },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            feeScheduleId: 2,
            feeScheduleName: 'ISS 2001',
            attentionLevelId: 3,
          } satisfies CupsSearchDialogData,
        },
      ],
    });

    fixture = TestBed.createComponent(CupsSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not search with fewer than 3 characters', async () => {
    await typeTerm('ab');

    expect(apiService.searchCups).not.toHaveBeenCalled();
    expect(component.items()).toEqual([]);
  });

  it('searches with fee schedule and attention level when the term has 3 or more chars', async () => {
    await typeTerm('123');

    expect(apiService.searchCups).toHaveBeenCalledWith('123', 2, 1, 20, 3);
    expect(component.items().length).toBe(2);
    expect(component.total()).toBe(3);
  });

  it('loads the next page on demand', async () => {
    await typeTerm('consulta');
    expect(component.hasMore()).toBe(true);

    component.loadMore();
    await flushSearch();

    expect(apiService.searchCups).toHaveBeenCalledWith('consulta', 2, 2, 20, 3);
    expect(component.items().length).toBe(3);
    expect(component.hasMore()).toBe(false);
  });

  it('searches without attention level when the dialog has none', async () => {
    TestBed.resetTestingModule();
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

    await typeTerm('123');

    expect(apiService.searchCups).toHaveBeenCalledWith('123', 2, 1, 20, undefined);
  });

  it('shows an error message when the request fails', async () => {
    apiService.searchCups.mockReturnValue(throwError(() => new Error('network')));
    await typeTerm('fallo');

    expect(component.error()).not.toBeNull();
  });

  it('resets the results when the term is cleared', async () => {
    await typeTerm('123');
    expect(component.items().length).toBe(2);

    await typeTerm('');

    expect(component.items()).toEqual([]);
    expect(component.total()).toBe(0);
  });

  it('closes the dialog with the selected CUPS', () => {
    component.selectCups(firstPage.items[0]);
    expect(dialogRef.close).toHaveBeenCalledWith(firstPage.items[0]);
  });

  it('closes the dialog without a value on cancel', () => {
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
