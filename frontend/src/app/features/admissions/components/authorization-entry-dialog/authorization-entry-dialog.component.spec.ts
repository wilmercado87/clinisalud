import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { AuthorizationEntryComponent } from '@features/admissions/components/authorization-entry/authorization-entry.component';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';
import { of } from 'rxjs';
import {
  AuthorizationEntryDialogComponent,
  AuthorizationEntryDialogData,
} from './authorization-entry-dialog.component';

describe('AuthorizationEntryDialogComponent', () => {
  let fixture: ComponentFixture<AuthorizationEntryDialogComponent>;
  let component: AuthorizationEntryDialogComponent;
  let entryComponent: AuthorizationEntryComponent;
  let dialogRef: { close: jest.Mock };

  const defaultDialogData: AuthorizationEntryDialogData = {
    existingAuthorizations: [],
    queuedAuthorizations: [],
    epsId: 8301138310,
  };

  async function setup(data: AuthorizationEntryDialogData): Promise<void> {
    dialogRef = { close: jest.fn() };
    const dialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) };

    await TestBed.configureTestingModule({
      imports: [AuthorizationEntryDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: dialog },
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: CatalogStore,
          useValue: {
            getCatalog: () => [],
            loadCatalog: jest.fn().mockReturnValue(of([])),
            reloadCatalog: jest.fn().mockReturnValue(of([])),
            contracts: signal([]).asReadonly(),
            loadContracts: jest.fn(),
            versionOf: () => 0,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthorizationEntryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    entryComponent = fixture.debugElement
      .query((node) => node.name === 'app-authorization-entry')!
      .injector.get(AuthorizationEntryComponent);
  }

  it('renders with the create title and forwards applied entries to the dialog close', async () => {
    await setup(defaultDialogData);

    expect(component.title()).toBe('Agregar Autorizaciones');

    const values: AuthorizationFormValue[] = [
      {
        authTypeId: 5,
        authNumber: 'AUTH-001',
        feeScheduleId: 2,
        mapiissCode: 'MAPIISS-1',
        quantity: 1,
        mapiissDescription: '',
        maxQuantity: null,
      },
    ];
    component.closeWith(values);

    expect(dialogRef.close).toHaveBeenCalledWith(values);
  });

  it('shows the edit title when an editIndex is provided and closes undefined on cancel', async () => {
    await setup({ ...defaultDialogData, editIndex: 1 });

    expect(component.title()).toBe('Editar Autorización');

    entryComponent.cancelled.emit();

    expect(dialogRef.close).toHaveBeenCalledWith();
  });
});
