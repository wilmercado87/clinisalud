// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (modal de registro)
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AuthEntryDialogComponent } from './auth-entry-dialog.component';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { AuthFormGroup } from '@features/admissions/utils/admission-form.types';
import { CupsSearchItem } from '@core/models/catalog.model';

@Component({
  selector: 'app-catalog-select',
  standalone: true,
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MockCatalogSelectComponent),
      multi: true,
    },
  ],
})
class MockCatalogSelectComponent implements ControlValueAccessor {
  readonly catalogType = input.required<string>();
  readonly label = input('');
  readonly errorMessage = input<string | null>(null);

  private onChange: (value: number | null) => void = () => {};

  writeValue(): void {}

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {}

  setDisabledState(): void {}
}

describe('AuthEntryDialogComponent', () => {
  let fixture: ComponentFixture<AuthEntryDialogComponent>;
  let component: AuthEntryDialogComponent;
  let dialogRef: { close: jest.Mock };
  let dialog: { open: jest.Mock };
  let authTypes: Array<{ id: number; name: string; description: string; attentionLevelId?: number }>;
  let catalogData: Record<string, unknown[]>;
  let reloadResult: unknown[];
  let reloadCatalogSpy: jest.Mock;

  beforeEach(async () => {
    dialogRef = { close: jest.fn() };
    dialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) };

    authTypes = [
      {
        id: 4,
        name: 'Aut. Urgencias',
        description: 'Aut. Urgencias',
        attentionLevelId: 2,
      },
      {
        id: 5,
        name: 'Aut. Cirugía Ambulatoria',
        description: 'Aut. Cirugía Ambulatoria',
        attentionLevelId: 2,
      },
    ];
    catalogData = {
      'authorization-types': authTypes,
      'fee-schedules': [{ id: 2, name: 'ISS 2001', description: 'ISS 2001' }],
    };
    reloadResult = authTypes;
    reloadCatalogSpy = jest.fn().mockImplementation((type: string) => {
      catalogData[type] = reloadResult;
      return of(reloadResult);
    });

    await TestBed.configureTestingModule({
      imports: [AuthEntryDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: dialog },
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: (type: string) => catalogData[type] ?? [],
            reloadCatalog: reloadCatalogSpy,
          },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .overrideComponent(AuthEntryDialogComponent, {
        remove: { imports: [CatalogSelectComponent] },
        add: { imports: [MockCatalogSelectComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuthEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillEntry(entry: AuthFormGroup): void {
    entry.patchValue({
      authTypeId: 5,
      authNumber: 'AUTH-001',
      feeScheduleId: 2,
      mapiissCode: 'MAPIISS-1',
      quantity: 2,
    });
    fixture.detectChanges();
  }

  it('starts with a single empty entry and Aplicar disabled', () => {
    expect(component.entries().length).toBe(1);
    expect(component.canApply()).toBe(false);
  });

  it('adds more entries and removes them', () => {
    component.addEntry();
    expect(component.entries().length).toBe(2);
    component.removeEntry(0);
    expect(component.entries().length).toBe(1);
  });

  it('keeps Aplicar disabled while required fields are missing', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    entry.controls.authNumber.setValue('');
    fixture.detectChanges();
    expect(component.canApply()).toBe(false);
  });

  it('enables Aplicar with a complete entry and returns the values on apply', () => {
    fillEntry(component.entries()[0]);
    expect(component.canApply()).toBe(true);

    component.apply();
    const values = dialogRef.close.mock.calls.at(-1)![0];
    expect(values).toEqual([
      {
        authTypeId: 5,
        authNumber: 'AUTH-001',
        feeScheduleId: 2,
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
        description: '',
        maxQuantity: null,
      },
    ]);
  });

  it('closes without values on cancel', () => {
    fillEntry(component.entries()[0]);
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('does not apply while a row is invalid even if others are complete', () => {
    fillEntry(component.entries()[0]);
    component.addEntry();
    fixture.detectChanges();
    expect(component.canApply()).toBe(false);
  });

  it('enables Aplicar when every field is completed one by one', () => {
    const entry = component.entries()[0];
    entry.controls.authTypeId.setValue(5);
    expect(component.canApply()).toBe(false);
    entry.controls.authNumber.setValue('AUTH-001');
    expect(component.canApply()).toBe(false);
    entry.controls.feeScheduleId.setValue(2);
    expect(component.canApply()).toBe(false);
    entry.controls.mapiissCode.setValue('MAPIISS-1');
    expect(component.canApply()).toBe(true);
    entry.controls.quantity.setValue(2);
    expect(component.canApply()).toBe(true);
  });

  it('disables Aplicar again when a completed entry becomes invalid', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    expect(component.canApply()).toBe(true);
    entry.controls.authNumber.setValue('');
    fixture.detectChanges();
    expect(component.canApply()).toBe(false);
  });

  it('clears the CUPS selection when the fee schedule changes', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    entry.controls.feeScheduleId.setValue(3);
    fixture.detectChanges();
    expect(entry.controls.mapiissCode.value).toBe('');
    expect(entry.controls.description.value).toBe('');
  });

  it('clears the CUPS selection when the auth type changes', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    entry.controls.authTypeId.setValue(4);
    fixture.detectChanges();
    expect(entry.controls.mapiissCode.value).toBe('');
    expect(entry.controls.description.value).toBe('');
  });

  it('opens the CUPS search filtered by the attention level of the auth type', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    component.openCupsSearch(0);

    const [, dialogConfig] = dialog.open.mock.calls.at(-1)!
    expect(dialogConfig.data).toEqual({
      feeScheduleId: 2,
      feeScheduleName: 'ISS 2001',
      attentionLevelId: 2,
    });
  });

  it('does not open the CUPS search when the auth type is missing', () => {
    const entry = component.entries()[0];
    entry.controls.feeScheduleId.setValue(2);
    fixture.detectChanges();
    component.openCupsSearch(0);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('reloads the catalog and opens the search when the level is missing', async () => {
    catalogData['authorization-types'] = authTypes.map(({ attentionLevelId: _removed, ...item }) => item);

    const entry = component.entries()[0];
    fillEntry(entry);
    await component.openCupsSearch(0);

    expect(reloadCatalogSpy).toHaveBeenCalledWith('authorization-types');
    expect(dialog.open).toHaveBeenCalled();
    const [, dialogConfig] = dialog.open.mock.calls.at(-1)!
    expect(dialogConfig.data.attentionLevelId).toBe(2);
  });

  it('applies the selected CUPS after the search dialog closes', async () => {
    const cups: CupsSearchItem = {
      id: 10,
      code: 'CODS',
      description: 'Fisioterapia',
      maxQuantity: 5,
      netValue: 100,
    };
    dialog.open.mockReturnValue({ afterClosed: () => of(cups) });

    const entry = component.entries()[0];
    fillEntry(entry);
    component.openCupsSearch(0);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(entry.controls.mapiissCode.value).toBe('CODS');
    expect(entry.controls.description.value).toBe('Fisioterapia');
    expect(entry.controls.maxQuantity.value).toBe(5);
  });
});