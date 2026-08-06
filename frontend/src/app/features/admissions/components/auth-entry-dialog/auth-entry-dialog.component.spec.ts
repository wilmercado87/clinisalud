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
  let dialogRef: { close: jasmine.Spy };
  let dialog: { open: jasmine.Spy };

  beforeEach(async () => {
    dialogRef = { close: jasmine.createSpy('close') };
    dialog = { open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(undefined) }) };

    await TestBed.configureTestingModule({
      imports: [AuthEntryDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: dialog },
        {
          provide: CatalogStore,
          useValue: { getCatalog: () => [] },
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
    expect(component.canApply()).toBeFalse();
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
    expect(component.canApply()).toBeFalse();
  });

  it('enables Aplicar with a complete entry and returns the values on apply', () => {
    fillEntry(component.entries()[0]);
    expect(component.canApply()).toBeTrue();

    component.apply();
    const values = dialogRef.close.calls.mostRecent().args[0];
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
    expect(component.canApply()).toBeFalse();
  });

  it('clears the CUPS selection when the fee schedule changes', () => {
    const entry = component.entries()[0];
    fillEntry(entry);
    entry.controls.feeScheduleId.setValue(3);
    fixture.detectChanges();
    expect(entry.controls.mapiissCode.value).toBe('');
    expect(entry.controls.description.value).toBe('');
  });

  it('applies the selected CUPS after the search dialog closes', async () => {
    const cups: CupsSearchItem = {
      id: 10,
      code: 'CODS',
      description: 'Fisioterapia',
      maxQuantity: 5,
      netValue: 100,
    };
    dialog.open.and.returnValue({ afterClosed: () => of(cups) });

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