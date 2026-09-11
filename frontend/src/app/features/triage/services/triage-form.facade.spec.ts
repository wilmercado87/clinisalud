import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { DiagnosticoResponse } from '@core/models/catalog.model';
import { CreateTriageRequest, CreateTriageResponse } from '@features/triage/models/triage.model';
import { TriageStore } from '@features/triage/store/triage.store';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { of } from 'rxjs';
import { TriageFormFacade } from './triage-form.facade';

class MockTriageStore {
  readonly isLookingUp = signal(false);
  readonly lookupError = signal<unknown>(undefined);
  readonly patientFound = signal<PatientLookupResponse | undefined>(undefined);
  readonly isCreating = signal(false);
  readonly createResult = signal<CreateTriageResponse | null>(null);
  readonly createError = signal<unknown>(undefined);

  lookupPatient = jest.fn();
  createTriage = jest.fn();
  clearCreateResult = jest.fn();
}

describe('TriageFormFacade', () => {
  let facade: TriageFormFacade;
  let store: MockTriageStore;

  const patient: PatientLookupResponse = {
    id: 7,
    documentTypeId: 1,
    document: '1020304050',
    firstName: 'Ana',
    lastName: 'Perez',
    age: '35',
    address: 'Calle 1',
    phone: '3001234567',
    email: null,
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1990-01-01',
    genderId: 1,
    epsId: 3,
    activeAdmission: null,
    gender: { id: 1, description: 'Masculino' },
    documentType: { id: 1, code: 'CC', description: 'Cédula' },
  };

  async function flushEffects(): Promise<void> {
    await TestBed.flushEffects();
  }

  beforeEach(async () => {
    store = new MockTriageStore();
    await TestBed.configureTestingModule({
      providers: [
        TriageFormFacade,
        { provide: TriageStore, useValue: store },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    }).compileComponents();
    facade = TestBed.inject(TriageFormFacade);
    await flushEffects();
  });

  it('starts idle with search enabled and register disabled', () => {
    expect(facade.mode()).toBe('IDLE');
    expect(facade.searchEnabled()).toBe(true);
    expect(facade.canRegister()).toBe(false);
  });

  it('requires both document fields before searching (INV-HC-03)', () => {
    facade.onSearchPatient();

    expect(store.lookupPatient).not.toHaveBeenCalled();
    expect(facade.feedback()?.type).toBe('info');
  });

  it('enters FOUND mode when the patient exists and preselects the EPS (INV-HC-03)', async () => {
    facade.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
    facade.onSearchPatient();
    store.isLookingUp.set(true);
    store.patientFound.set(patient);
    await flushEffects();

    store.isLookingUp.set(false);
    await flushEffects();

    expect(facade.mode()).toBe('FOUND');
    expect(facade.triageForm.controls.epsId.value).toBe(3);
    expect(facade.attentionDate()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('enters NOT_FOUND mode when the patient does not exist and requires patient data', async () => {
    facade.patientForm.patchValue({ documentTypeId: 1, document: '999999999' });
    facade.onSearchPatient();
    store.isLookingUp.set(true);
    await flushEffects();

    store.isLookingUp.set(false);
    await flushEffects();

    expect(facade.mode()).toBe('NOT_FOUND');
    expect(facade.patientForm.controls.firstName.hasError('required')).toBe(true);
    expect(facade.canRegister()).toBe(false);
  });

  it('builds the request for an existing patient on submit', async () => {
    facade.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
    facade.onSearchPatient();
    store.isLookingUp.set(true);
    await flushEffects();

    store.isLookingUp.set(false);
    store.patientFound.set(patient);
    await flushEffects();

    expect(facade.mode()).toBe('FOUND');

    facade.triageForm.setValue({ priorityTypeId: 2, epsId: 3, diagnosticId: 5 });

    expect(facade.canRegister()).toBe(true);
    facade.onSubmit();

    expect(store.createTriage).toHaveBeenCalledWith(
      expect.objectContaining<CreateTriageRequest>({
        isNewPatient: false,
        documentTypeId: 1,
        document: '1020304050',
        priorityTypeId: 2,
        epsId: 3,
        diagnosticId: 5,
      }),
    );
  });

  it('informs when submitting without required triage data', async () => {
    facade.patientForm.patchValue({ documentTypeId: 1, document: '999999999' });
    facade.onSearchPatient();
    await flushEffects();

    facade.onSubmit();

    expect(store.createTriage).not.toHaveBeenCalled();
    expect(facade.feedback()?.type).toBe('info');
  });

  it('resets everything after a successful save (INV-HC-04)', async () => {
    store.createResult.set({
      triage: {
        id: 1,
        priorityTypeId: 2,
        pacienteId: 7,
        attentionDate: '2026-08-21 10:00:00',
        epsId: 3,
        diagnosticId: 5,
        systemUserId: 1,
      },
      patient: { id: 7, documentTypeId: 1, document: '1020304050' },
    });
    await flushEffects();

    expect(facade.feedback()?.type).toBe('success');
    expect(facade.mode()).toBe('IDLE');
    expect(store.clearCreateResult).toHaveBeenCalled();
  });

  it('opens the diagnostic dialog and stores the selection', async () => {
    const diagnostic: DiagnosticoResponse = { id: 5, code: 'A900', description: 'Cólera por vibrio cholerae' };
    const dialogRef = { afterClosed: () => of(diagnostic) };
    (TestBed.inject(MatDialog).open as jest.Mock).mockReturnValue(dialogRef);

    await facade.openDiagnosticSearch();

    expect(facade.selectedDiagnostic()?.id).toBe(5);
    expect(facade.triageForm.controls.diagnosticId.value).toBe(5);
    expect(facade.diagnosticLabel()).toContain('A900');
  });
});
