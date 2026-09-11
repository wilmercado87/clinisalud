import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DiagnosticoResponse } from '@core/models/catalog.model';
import { CatalogService } from '@core/services/catalog.service';
import { of, throwError } from 'rxjs';
import {
  DiagnosticSearchDialogComponent,
  DiagnosticSearchDialogData,
} from './diagnostic-search-dialog.component';

jest.setTimeout(6000);

describe('DiagnosticSearchDialogComponent', () => {
  let fixture: ComponentFixture<DiagnosticSearchDialogComponent>;
  let component: DiagnosticSearchDialogComponent;
  let catalogApi: { searchDiagnostics: jest.Mock };
  let dialogRef: { close: jest.Mock };

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
    catalogApi = {
      searchDiagnostics: jest.fn().mockReturnValue(
        of([
          { id: 1, code: 'A900', description: 'Cólera' },
          { id: 2, code: 'B150', description: 'Hepatitis viral A' },
        ] satisfies DiagnosticoResponse[]),
      ),
    };
    dialogRef = { close: jest.fn() };

    TestBed.configureTestingModule({
      imports: [DiagnosticSearchDialogComponent],
      providers: [
        { provide: CatalogService, useValue: catalogApi },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { currentDiagnosticId: null } satisfies DiagnosticSearchDialogData },
      ],
    });

    fixture = TestBed.createComponent(DiagnosticSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not search with fewer than 3 characters', async () => {
    await typeTerm('co');

    expect(catalogApi.searchDiagnostics).not.toHaveBeenCalled();
    expect(component.items()).toEqual([]);
  });

  it('searches and lists diagnostics when the term has 3 or more chars', async () => {
    await typeTerm('colera');

    expect(catalogApi.searchDiagnostics).toHaveBeenCalledWith('colera');
    expect(component.items().length).toBe(2);
    expect(component.error()).toBeNull();
  });

  it('closes the dialog with the selected diagnostic', () => {
    const item: DiagnosticoResponse = { id: 5, code: 'A900', description: 'Cólera' };

    component.selectDiagnostic(item);

    expect(dialogRef.close).toHaveBeenCalledWith(item);
  });

  it('closes the dialog without a value on cancel', () => {
    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('shows an error message when the request fails', async () => {
    catalogApi.searchDiagnostics.mockReturnValue(throwError(() => ({ status: 500, error: {} })));
    await typeTerm('fallo');

    expect(component.error()).toContain('Error al buscar diagnósticos');
  });
});
