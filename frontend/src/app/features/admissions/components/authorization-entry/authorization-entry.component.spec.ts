import { Component, forwardRef, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { CupsSearchItem } from '@core/models/catalog.model';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import {
  AuthorizationEntryComponent,
  AuthorizationEntryUpdate,
} from '@features/admissions/components/authorization-entry/authorization-entry.component';
import { AuthorizationFormGroup, AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { of } from 'rxjs';

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

describe('AuthorizationEntryComponent', () => {
  let fixture: ComponentFixture<AuthorizationEntryComponent>;
  let component: AuthorizationEntryComponent;
  let dialog: { open: jest.Mock };
  let authTypes: Array<{ id: number; name: string; description: string; attentionLevelId?: number }>;
  let catalogData: Record<string, unknown[]>;
  let reloadResult: unknown[];
  let reloadCatalogSpy: jest.Mock;

  const defaultContractFeeScheduleId = 2;

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [AuthorizationEntryComponent],
      providers: [
        { provide: MatDialog, useValue: dialog },
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: (type: string) => catalogData[type] ?? [],
            loadCatalog: jest.fn().mockImplementation((type: string) => of(catalogData[type] ?? [])),
            reloadCatalog: reloadCatalogSpy,
          },
        },
      ],
    })
      .overrideComponent(AuthorizationEntryComponent, {
        remove: { imports: [CatalogSelectComponent] },
        add: { imports: [MockCatalogSelectComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuthorizationEntryComponent);
    fixture.componentRef.setInput('contractFeeScheduleId', defaultContractFeeScheduleId);
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

  function collectApplied(): AuthorizationFormValue[][] {
    const collected: AuthorizationFormValue[][] = [];
    component.entriesApplied.subscribe((values) => collected.push(values));
    return collected;
  }

  function collectUpdated(): AuthorizationEntryUpdate[] {
    const collected: AuthorizationEntryUpdate[] = [];
    component.entryUpdated.subscribe((update) => collected.push(update));
    return collected;
  }

  function collectCancelled(): number[] {
    const ticks: number[] = [];
    component.cancelled.subscribe(() => ticks.push(1));
    return ticks;
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

  it('emits the values on apply and resets to a blank entry', () => {
    const applied = collectApplied();
    fillEntry(component.entries()[0]);
    expect(component.canApply()).toBe(true);

    component.apply();

    expect(applied).toEqual([
      [
        {
          authTypeId: 5,
          authNumber: 'AUTH-001',
          feeScheduleId: 2,
          mapiissCode: 'MAPIISS-1',
          quantity: 2,
          mapiissDescription: '',
          maxQuantity: null,
        },
      ],
    ]);
    expect(component.entries().length).toBe(1);
    expect(component.entries()[0].controls.authNumber.value).toBe('');
  });

  it('emits cancelled and resets on cancel', () => {
    const cancelled = collectCancelled();
    fillEntry(component.entries()[0]);

    component.cancel();

    expect(cancelled.length).toBe(1);
    expect(component.entries().length).toBe(1);
    expect(component.entries()[0].controls.authNumber.value).toBe('');
  });

  it('does not emit on apply when business rules are violated, shows the status message and marks the row', () => {
    const applied = collectApplied();
    component.addEntry();
    fillEntry(component.entries()[0]);
    fillEntry(component.entries()[1]);
    expect(component.canApply()).toBe(true);

    expect(component.statusMessage()).toBeNull();
    expect(component.affectedRows()).toEqual(new Set());

    component.apply();

    expect(applied.length).toBe(0);
    expect(component.statusMessage()).toContain('AUTH-001');
    expect(component.statusMessage()).toContain('MAPIISS-1');
    expect(component.affectedRows()).toEqual(new Set([0, 1]));

    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.authorization-entry__block');
    expect(rows[0].classList.contains('authorization-entry__block--invalid')).toBe(true);
    expect(rows[1].classList.contains('authorization-entry__block--invalid')).toBe(true);
    expect(fixture.nativeElement.querySelector('.authorization-entry__status').textContent).toContain('AUTH-001');
  });

  it('emits once the rule violation is fixed and clears the status', () => {
    const applied = collectApplied();
    component.addEntry();
    fillEntry(component.entries()[0]);
    fillEntry(component.entries()[1]);
    component.apply();
    expect(component.statusMessage()).toBeTruthy();

    component.entries()[1].controls.mapiissCode.setValue('MAPIISS-2');
    fixture.detectChanges();
    component.apply();

    expect(applied.length).toBe(1);
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

  it('applies the resolved tariff to every entry as read-only', () => {
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

  it('blocks apply and stays silent when no tariff is provided (host owns the message)', () => {
    fixture.componentRef.setInput('contractFeeScheduleId', null);
    fixture.detectChanges();

    expect(component.canApply()).toBe(false);
    expect(component.statusMessage()).toBeNull();
  });

  it('clears the CUPS selection when the auth type changes', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    entry.controls.authTypeId.setValue(4);
    fixture.detectChanges();
    expect(entry.controls.mapiissCode.value).toBe('');
    expect(entry.controls.mapiissDescription.value).toBe('');
  });

  it('loads an initial entry for editing and emits an update on apply', () => {
    const updated = collectUpdated();
    const initialEntry: AuthorizationFormValue = {
      authTypeId: 5,
      authNumber: 'AUTH-009',
      feeScheduleId: 2,
      mapiissCode: 'MAPIISS-9',
      quantity: 1,
      mapiissDescription: '',
      maxQuantity: null,
    };
    fixture.componentRef.setInput('editIndex', 2);
    fixture.componentRef.setInput('initialEntry', initialEntry);
    fixture.detectChanges();

    expect(component.entries().length).toBe(1);
    expect(component.entries()[0].getRawValue()).toEqual(initialEntry);

    component.apply();

    expect(updated).toEqual([{ editIndex: 2, entry: initialEntry }]);
  });

  it('treats a null editIndex binding as create mode and emits entriesApplied', () => {
    const applied = collectApplied();
    const updated = collectUpdated();
    fixture.componentRef.setInput('editIndex', null);
    fixture.detectChanges();

    fillEntry(component.entries()[0]);
    component.apply();

    expect(applied.length).toBe(1);
    expect(updated.length).toBe(0);
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
    expect(entry.controls.mapiissDescription.value).toBe('Fisioterapia');
    expect(entry.controls.maxQuantity.value).toBe(5);
  });
});
