import { Component, forwardRef, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ContratoResponse, CupsSearchItem } from '@core/models/catalog.model';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { AuthorizationFormGroup } from '@features/admissions/utils/authorization/authorization-form.types';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { of } from 'rxjs';
import {
  AuthorizationEntryDialogComponent,
  AuthorizationEntryDialogData,
} from './authorization-entry-dialog.component';

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

describe('AuthorizationEntryDialogComponent', () => {
  let fixture: ComponentFixture<AuthorizationEntryDialogComponent>;
  let component: AuthorizationEntryDialogComponent;
  let dialogRef: { close: jest.Mock };
  let dialog: { open: jest.Mock };
  let authTypes: Array<{ id: number; name: string; description: string; attentionLevelId?: number }>;
  let catalogData: Record<string, unknown[]>;
  let reloadResult: unknown[];
  let reloadCatalogSpy: jest.Mock;
  let contractsSignal: ReturnType<typeof signal<ContratoResponse[]>>;
  let loadContractsSpy: jest.Mock;

  const defaultDialogData: AuthorizationEntryDialogData = {
    existingAuthorizations: [],
    queuedAuthorizations: [],
    epsId: 8301138310,
  };

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
      'fee-schedules': [{ id: 2, name: 'ISS_2001', description: 'ISS_2001' }],
    };
    reloadResult = authTypes;
    reloadCatalogSpy = jest.fn().mockImplementation((type: string) => {
      catalogData[type] = reloadResult;
      return of(reloadResult);
    });
    contractsSignal = signal<ContratoResponse[]>([
      {
        id: 1,
        name: 'CONTR-01',
        epsId: 8301138310,
        feeScheduleId: 2,
        contractNumber: 'CONTR-01',
        startDate: '1/01/2016',
        endDate: '31/07/2018',
      },
    ]);
    loadContractsSpy = jest.fn();

    await TestBed.configureTestingModule({
      imports: [AuthorizationEntryDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: dialog },
        { provide: MAT_DIALOG_DATA, useValue: defaultDialogData },
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: (type: string) => catalogData[type] ?? [],
            loadCatalog: jest.fn().mockImplementation((type: string) => of(catalogData[type] ?? [])),
            reloadCatalog: reloadCatalogSpy,
            contracts: contractsSignal.asReadonly(),
            loadContracts: loadContractsSpy,
          },
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .overrideComponent(AuthorizationEntryDialogComponent, {
        remove: { imports: [CatalogSelectComponent] },
        add: { imports: [MockCatalogSelectComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuthorizationEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillEntry(entry: AuthorizationFormGroup): void {
    entry.patchValue({
      authTypeId: 5,
      authNumber: 'AUTH-001',
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

  it('does not close on apply when business rules are violated, shows the status message and marks the row', () => {
    component.addEntry();
    fillEntry(component.entries()[0]);
    fillEntry(component.entries()[1]);
    expect(component.canApply()).toBe(true);

    expect(component.statusMessage()).toBeNull();
    expect(component.affectedRows()).toEqual(new Set());

    component.apply();

    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.statusMessage()).toContain('AUTH-001');
    expect(component.statusMessage()).toContain('MAPIISS-1');
    expect(component.affectedRows()).toEqual(new Set([0, 1]));

    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.auth-dialog__entry');
    expect(rows[0].classList.contains('auth-dialog__entry--invalid')).toBe(true);
    expect(rows[1].classList.contains('auth-dialog__entry--invalid')).toBe(true);
    expect(fixture.nativeElement.querySelector('.auth-dialog__status').textContent).toContain('AUTH-001');
  });

  it('closes on apply once the rule violation is fixed and clears the status', () => {
    component.addEntry();
    fillEntry(component.entries()[0]);
    fillEntry(component.entries()[1]);
    component.apply();
    expect(component.statusMessage()).toBeTruthy();

    component.entries()[1].controls.mapiissCode.setValue('MAPIISS-2');
    fixture.detectChanges();
    component.apply();

    expect(dialogRef.close).toHaveBeenCalled();
    expect(component.statusMessage()).toBeNull();
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

  it('derives the tariff from the EPS contract and applies it to every entry as read-only', () => {
    expect(loadContractsSpy).toHaveBeenCalledWith(8301138310);
    expect(component.contractFeeScheduleId()).toBe(2);
    expect(component.feeScheduleName()).toBe('ISS 2001');
    expect(component.tariffNoteMessage()).toBe(
      'El tarifario ISS 2001 se identifica automáticamente según el contrato de la EPS.',
    );
    const entry = component.entries()[0];
    expect(entry.controls.feeScheduleId.value).toBe(2);
    expect(entry.controls.feeScheduleId.disabled).toBe(true);

    component.addEntry();
    fixture.detectChanges();
    expect(component.entries()[1].controls.feeScheduleId.value).toBe(2);
    expect(component.entries()[1].controls.feeScheduleId.disabled).toBe(true);
  });

  it('blocks apply and explains when the admission has no EPS selected', () => {
    component.dialogData.set({ ...defaultDialogData, epsId: null });
    fixture.detectChanges();

    expect(component.contractFeeScheduleId()).toBeNull();
    expect(component.canApply()).toBe(false);
    expect(component.statusMessage()).toContain('Seleccione la EPS');
  });

  it('blocks apply when the EPS has no contract', () => {
    contractsSignal.set([]);
    fixture.detectChanges();

    expect(component.canApply()).toBe(false);
    expect(component.statusMessage()).toContain('no tiene un contrato');
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

    const [, dialogConfig] = dialog.open.mock.calls.at(-1)!;
    expect(dialogConfig.data).toEqual({
      feeScheduleId: 2,
      feeScheduleName: 'ISS 2001',
      attentionLevelId: 2,
    });
  });

  it('does not open the CUPS search when the auth type is missing', () => {
    const entry = component.entries()[0];
    entry.controls.authNumber.setValue('AUTH-001');
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
    const [, dialogConfig] = dialog.open.mock.calls.at(-1)!;
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
