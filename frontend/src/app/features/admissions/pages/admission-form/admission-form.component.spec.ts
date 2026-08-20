// @spec:INV-ADM-02 — Control de Autorizaciones por Servicio (request de autorizaciones)
import { HttpErrorResponse } from '@angular/common/http';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { PatientLookupResponse } from '@features/admissions/models/admissions.model';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { AdmissionFormComponent } from './admission-form.component';

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
  readonly required = input(false);
  readonly includeOccupiedBeds = input(false);
  readonly clearable = input(true);

  private onChange: (value: number | null) => void = () => {};

  writeValue(): void {}

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {}

  setDisabledState(): void {}

  forceReset(): void {
    this.onChange(null);
  }
}

class MockAdmissionStore {
  readonly isLookingUp = signal(false);
  readonly lookupError = signal<unknown>(null);
  readonly patientFound = signal<PatientLookupResponse | null>(null);
  readonly isCreating = signal(false);
  readonly createResult = signal<unknown>(null);
  readonly createError = signal<unknown>(null);
  readonly isUpdating = signal(false);
  readonly updateResult = signal<unknown>(null);
  readonly updateError = signal<unknown>(null);

  lookupPatient = jest.fn();
  createAdmission = jest.fn();
  clearCreateResult = jest.fn();
  updateAdmission = jest.fn();
  clearUpdateResult = jest.fn();
}

describe('AdmissionFormComponent', () => {
  let component: AdmissionFormComponent;
  let fixture: ComponentFixture<AdmissionFormComponent>;
  let store: MockAdmissionStore;
  let catalogStore: {
    getCatalog: jest.Mock;
    invalidateCatalog: jest.Mock;
  };

  const patient: PatientLookupResponse = {
    id: 7,
    documentTypeId: 1,
    document: '1020304050',
    firstName: 'Ana',
    lastName: 'Perez',
    age: '35',
    address: 'Calle 1',
    phone: '3001234567',
    email: 'ana@correo.com',
    disability: 'NO',
    userTypeId: 1,
    birthDate: '1990-01-01',
    genderId: 1,
    epsId: 3,
    activeAdmission: null,
  };

  const patientWithActiveAdmission: PatientLookupResponse = {
    ...patient,
    activeAdmission: {
      admissionNumber: 'ADM-20260804-0001',
      admissionDate: '2026-08-04',
      roomId: 5,
      observations: 'Requiere control diario',
      authorizations: [
        {
          authTypeId: 2,
          authTypeName: 'Autorización Previa',
          authNumber: 'AUTH-001',
          mapiissCode: 'CUP-001',
          quantity: 2,
          feeScheduleId: 1,
        },
      ],
    },
  };

  async function flushEffects(): Promise<void> {
    for (let attempt = 0; attempt < 5; attempt++) {
      fixture.detectChanges();
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  beforeEach(async () => {
    store = new MockAdmissionStore();
    store.clearCreateResult = jest.fn().mockImplementation(() => {
      store.createResult.set(null);
    });
    store.clearUpdateResult = jest.fn().mockImplementation(() => {
      store.updateResult.set(null);
    });
    catalogStore = {
      getCatalog: jest.fn().mockReturnValue([]),
      invalidateCatalog: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdmissionFormComponent],
      providers: [
        { provide: AdmissionStore, useValue: store },
        { provide: CatalogStore, useValue: catalogStore },
        provideRouter([]),
      ],
    })
      .overrideComponent(AdmissionFormComponent, {
        remove: { imports: [CatalogSelectComponent] },
        add: { imports: [MockCatalogSelectComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdmissionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('birth date age validation', () => {
    async function goToNotFound(): Promise<void> {
      component.patientForm.patchValue({ documentTypeId: 1, document: '999999999' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.lookupError.set(
        new HttpErrorResponse({ status: 404, statusText: 'Not Found', error: { message: 'Paciente no encontrado' } }),
      );
      await flushEffects();
      expect(component.mode()).toBe('NOT_FOUND');
    }

it('shows the age validation message under Fecha Nacimiento when the birth date produces an invalid age', async () => {
      await goToNotFound();

      component.patientForm.controls.birthDate.setValue(new Date(1800, 0, 1));
      component.patientForm.controls.birthDate.markAsTouched();
      await flushEffects();

      expect(component.patientForm.controls.birthDate.hasError('invalidAge')).toBe(true);
      expect(component.patientErrors().birthDate).toBe('Edad no válida (0 a 120 años)');

      const birthField = (
        fixture.nativeElement.querySelector('input[formcontrolname="birthDate"]') as HTMLElement
      ).closest('.mat-mdc-form-field') as HTMLElement;
      expect(birthField.textContent).toContain('Edad no válida (0 a 120 años)');
    });
  });

  describe('patient lookup', () => {
    it('searches a patient with document type and number', () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();

      expect(store.lookupPatient).toHaveBeenCalledWith(1, '1020304050');
      expect(component.mode()).toBe('SEARCHING');
    });

    it('warns when document fields are missing', () => {
      component.onSearchPatient();
      expect(store.lookupPatient).not.toHaveBeenCalled();
      expect(component.feedback()).toEqual({
        type: 'info',
        message: 'Seleccione tipo de documento e ingrese número',
      });
    });

    it('fills the patient data when found', async () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.patientFound.set(patient);
      await flushEffects();

      expect(component.mode()).toBe('FOUND');
      expect(component.patientForm.controls.firstName.value).toBe('Ana');
      expect(component.patientForm.controls.genderId.value).toBe(1);
      expect(component.admissionForm.controls.epsId.value).toBe(3);
    });

    it('enables the data form when the patient does not exist', async () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '999999999' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.lookupError.set(
        new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: { message: 'Paciente no encontrado' },
        }),
      );
      await flushEffects();

      expect(component.mode()).toBe('NOT_FOUND');
      expect(component.patientForm.controls.firstName.enabled).toBe(true);
    });

    it('shows an inline error on unexpected lookup errors', async () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.lookupError.set(new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' }));
      await flushEffects();

      expect(component.mode()).toBe('IDLE');
      expect(component.feedback()).toEqual({
        type: 'error',
        message: 'Error al buscar el paciente',
      });
    });

    it('enables the submit button after filling the admission fields for an existing patient', async () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.patientFound.set(patient);
      await flushEffects();

      expect(component.mode()).toBe('FOUND');
      expect(component.patientForm.controls.firstName.value).toBe('Ana');

      component.admissionForm.patchValue({ roomId: 5, observations: 'Ingreso por urgencias' });
      await flushEffects();

      expect(component.facade.patientFormSignals.status()).toBe('VALID');
      expect(component.facade.admissionFormSignals.status()).toBe('VALID');
      expect(component.canSubmit()).toBe(true);

      component.onSubmit();
      expect(store.createAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewPatient: false,
          documentTypeId: 1,
          document: '1020304050',
        }),
      );
    });

    it('blocks the submit when the patient already has an active admission', async () => {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.patientFound.set(patientWithActiveAdmission);
      await flushEffects();

      component.admissionForm.patchValue({ roomId: 5, observations: 'Requiere control diario' });
      await flushEffects();

      expect(component.activeAdmission()).not.toBeNull();
      expect(component.canSubmit()).toBe(false);

      component.onSubmit();
      expect(store.createAdmission).not.toHaveBeenCalled();
      expect(store.updateAdmission).not.toHaveBeenCalled();
    });
  });

  describe('active admission update mode (INV-ADM-07)', () => {
    async function openUpdateMode(): Promise<void> {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.patientFound.set(patientWithActiveAdmission);
      await flushEffects();
    }

    it('enables only the bed, prefilled from the active admission; observations stays disabled', async () => {
      await openUpdateMode();

      expect(component.isUpdatingMode()).toBe(true);
      expect(component.patientForm.controls.firstName.enabled).toBe(false);
      expect(component.patientForm.controls.document.enabled).toBe(false);
      expect(component.companionForm.controls.firstName.enabled).toBe(false);
      expect(component.admissionForm.controls.epsId.enabled).toBe(false);
      expect(component.admissionForm.controls.observations.enabled).toBe(false);
      expect(component.admissionForm.controls.observations.value).toBe('Requiere control diario');
      expect(component.admissionForm.controls.roomId.enabled).toBe(true);
      expect(component.admissionForm.controls.roomId.value).toBeNull();
    });

    it('lists only available beds and does not allow clearing the assigned bed (INV-ADM-07)', async () => {
      await openUpdateMode();

      const bedSelect = fixture.debugElement.queryAll(By.css('app-catalog-select'))[6]
        .componentInstance as MockCatalogSelectComponent;

      expect(bedSelect.includeOccupiedBeds()).toBe(false);
      expect(bedSelect.clearable()).toBe(false);
    });

    it('shows the occupied bed as an informative label above the bed field', async () => {
      catalogStore.getCatalog = jest
        .fn()
        .mockReturnValue([{ roomId: 5, bedCode: 'HAB105', bedStatus: 1, tipoCama: 'hospitalizado' }]);
      await openUpdateMode();
      fixture.detectChanges();

      const hint = fixture.debugElement.query(By.css('.admission-form__bed-hint'));
      expect(hint).not.toBeNull();
      expect(hint.nativeElement.textContent.trim()).toBe('Cama ocupada: HAB105 - hospitalizado');
    });

    it('clears the bed selector after updating the bed (INV-ADM-07)', async () => {
      catalogStore.getCatalog = jest
        .fn()
        .mockReturnValue([{ roomId: 6, bedCode: 'HAB106', bedStatus: 1, tipoCama: 'hospitalizado' }]);
      await openUpdateMode();
      component.admissionForm.controls.roomId.setValue(6);
      await flushEffects();
      store.isUpdating.set(true);
      component.onSubmit();
      store.isUpdating.set(false);
      store.updateResult.set({
        admissionNumber: 'ADM-20260804-0001',
        roomId: 6,
        authorizations: [],
      });
      await flushEffects();
      store.patientFound.set({
        ...patientWithActiveAdmission,
        activeAdmission: { ...patientWithActiveAdmission.activeAdmission!, roomId: 6 },
      });
      await flushEffects();
      fixture.detectChanges();

      expect(component.admissionForm.controls.roomId.value).toBeNull();
      const hint = fixture.debugElement.query(By.css('.admission-form__bed-hint'));
      expect(hint).not.toBeNull();
      expect(hint.nativeElement.textContent.trim()).toBe('Cama ocupada: HAB106 - hospitalizado');
    });

    it('shows the existing authorizations of the active admission as read-only rows', async () => {
      await openUpdateMode();

      expect(component.existingAuthRows()).toEqual([
        {
          authTypeName: 'Autorización Previa',
          authNumber: 'AUTH-001',
          mapiissCode: 'CUP-001',
          quantity: 2,
        },
      ]);
    });

    it('enables submit only when the bed, observations or authorizations change', async () => {
      await openUpdateMode();
      expect(component.canSubmit()).toBe(false);

      component.admissionForm.controls.roomId.setValue(5);
      await flushEffects();
      expect(component.canSubmit()).toBe(false);

      component.admissionForm.controls.roomId.setValue(6);
      await flushEffects();
      expect(component.canSubmit()).toBe(true);

      component.admissionForm.controls.roomId.setValue(5);
      component.admissionForm.controls.observations.setValue('Otra observación');
      await flushEffects();
      expect(component.canSubmit()).toBe(true);
    });

    it('updates the admission with the new bed only', async () => {
      await openUpdateMode();
      component.admissionForm.controls.roomId.setValue(6);
      await flushEffects();

      component.onSubmit();

      expect(store.createAdmission).not.toHaveBeenCalled();
      expect(store.updateAdmission).toHaveBeenCalledWith('ADM-20260804-0001', { roomId: 6 });
    });

    it('updates the admission with the new observations only', async () => {
      await openUpdateMode();
      component.admissionForm.controls.observations.setValue('Paciente en observación');
      await flushEffects();

      component.onSubmit();

      expect(store.updateAdmission).toHaveBeenCalledWith('ADM-20260804-0001', {
        observations: 'Paciente en observación',
      });
    });

    it('updates the admission with the new authorizations only', async () => {
      await openUpdateMode();
      component.appendAuthEntries([
        {
          authTypeId: 5,
          authNumber: 'AUTH-002',
          feeScheduleId: 2,
          mapiissCode: 'MAPIISS-2',
          quantity: 1,
          description: 'Consulta',
          observaciones: '',
          maxQuantity: 3,
        },
      ]);
      await flushEffects();

      component.onSubmit();

      expect(store.updateAdmission).toHaveBeenCalledWith('ADM-20260804-0001', {
        authorizations: [
          { authTypeId: 5, authNumber: 'AUTH-002', mapiissCode: 'MAPIISS-2', feeScheduleId: 2, quantity: 1 },
        ],
      });
    });

    it('warns when there are no pending changes', async () => {
      await openUpdateMode();
      component.onSubmit();

      expect(store.updateAdmission).not.toHaveBeenCalled();
      expect(component.feedback()).toEqual({
        type: 'info',
        message: 'Seleccione una cama o agregue autorizaciones para actualizar la admisión',
      });
    });

    it('refreshes the patient data and invalidates the beds catalog on success', async () => {
      await openUpdateMode();
      component.admissionForm.controls.roomId.setValue(6);
      await flushEffects();
      store.isUpdating.set(true);
      component.onSubmit();
      store.isUpdating.set(false);
      store.updateResult.set({ admissionNumber: 'ADM-20260804-0001', roomId: 6, authorizations: [] });
      await flushEffects();

      expect(component.feedback()).toEqual({
        type: 'success',
        message: 'Admisión ADM-20260804-0001 actualizada correctamente',
      });
      expect(store.clearUpdateResult).toHaveBeenCalled();
      expect(catalogStore.invalidateCatalog).toHaveBeenCalledWith('beds');
      expect(store.lookupPatient).toHaveBeenCalledWith(1, '1020304050');
      expect(component.authEntries()).toEqual([]);
    });

    it('keeps the success message when the post-update refresh fills the patient again', async () => {
      await openUpdateMode();
      component.admissionForm.controls.observations.setValue('Actualizada');
      await flushEffects();
      store.isUpdating.set(true);
      component.onSubmit();
      store.isUpdating.set(false);
      store.updateResult.set({
        admissionNumber: 'ADM-20260804-0001',
        roomId: 5,
        observations: 'Actualizada',
        authorizations: [],
      });
      await flushEffects();

      expect(component.feedback()?.type).toBe('success');

      store.patientFound.set({
        ...patientWithActiveAdmission,
        activeAdmission: {
          ...patientWithActiveAdmission.activeAdmission!,
          observations: 'Actualizada',
        },
      });
      await flushEffects();

      expect(component.feedback()?.type).toBe('success');
      expect(component.admissionForm.controls.observations.value).toBe('Actualizada');
    });

    it('shows the server error on failure', async () => {
      await openUpdateMode();
      component.admissionForm.controls.roomId.setValue(6);
      await flushEffects();
      store.isUpdating.set(true);
      component.onSubmit();
      store.isUpdating.set(false);
      store.updateError.set(
        new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: { message: 'La cama seleccionada no está disponible' },
        }),
      );
      await flushEffects();

      expect(component.feedback()).toEqual({
        type: 'error',
        message: 'La cama seleccionada no está disponible',
      });
    });
  });

  describe('admission creation', () => {
    async function fillValidForm(): Promise<void> {
      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.lookupError.set(
        new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: { message: 'Paciente no encontrado' },
        }),
      );
      await flushEffects();
      component.patientForm.patchValue({
        firstName: 'Ana',
        lastName: 'Perez',
        birthDate: new Date(1990, 0, 1),
        genderId: 1,
        disability: 'NO',
        userTypeId: 1,
      });
      component.admissionForm.patchValue({
        epsId: 3,
        roomId: 4,
        observations: 'Ingreso por urgencias',
      });
      await flushEffects();
    }

    it('creates the admission with the new patient payload', async () => {
      await fillValidForm();
      expect(component.canSubmit()).toBe(true);

      component.onSubmit();

      expect(store.createAdmission).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewPatient: true,
          documentTypeId: 1,
          document: '1020304050',
          firstName: 'Ana',
          lastName: 'Perez',
          epsId: 3,
          roomId: 4,
          observations: 'Ingreso por urgencias',
          companion: undefined,
          authorizations: undefined,
        }),
      );
    });

    it('includes the companion data when filled', async () => {
      await fillValidForm();
      component.companionForm.patchValue({
        firstName: 'Luis',
        lastName: 'Gomez',
        documentTypeId: 1,
        document: '987654321',
        address: 'Calle 2',
        relationshipId: 2,
        phone: '3111234567',
      });
      await flushEffects();

      component.onSubmit();

      const payload = store.createAdmission.mock.calls.at(-1)![0];
      expect(payload.companion).toEqual({
        firstName: 'Luis',
        lastName: 'Gomez',
        documentTypeId: 1,
        document: '987654321',
        address: 'Calle 2',
        relationshipId: 2,
        phone: '3111234567',
      });
    });

    it('includes the authorizations when enabled', async () => {
      await fillValidForm();
      component.appendAuthEntries([
        {
          authTypeId: 5,
          authNumber: 'AUTH-001',
          feeScheduleId: 2,
          mapiissCode: 'MAPIISS-1',
          quantity: 2,
          description: 'Consulta',
          observaciones: '',
          maxQuantity: 3,
        },
      ]);
      await flushEffects();

      component.onSubmit();

      const payload = store.createAdmission.mock.calls.at(-1)![0];
      expect(payload.authorizations).toEqual([
        { authTypeId: 5, authNumber: 'AUTH-001', mapiissCode: 'MAPIISS-1', feeScheduleId: 2, quantity: 2 },
      ]);
    });

    it('warns when the form is not complete', async () => {
      component.mode.set('NOT_FOUND');
      await flushEffects();
      component.onSubmit();

      expect(store.createAdmission).not.toHaveBeenCalled();
      expect(component.feedback()).toEqual({
        type: 'info',
        message: 'Complete los campos requeridos para registrar la admisión',
      });
    });

    it('resets the form and invalidates the beds catalog on success', async () => {
      await fillValidForm();
      store.isCreating.set(true);
      component.onSubmit();
      store.isCreating.set(false);
      store.createResult.set({
        admissionNumber: '2026-000001',
        patient: { id: 7, documentTypeId: 1, document: '1020304050' },
        admission: { id: 11 },
      });
      await flushEffects();

      expect(component.feedback()).toEqual({
        type: 'success',
        message: 'Admisión 2026-000001 registrada correctamente',
      });
      expect(store.clearCreateResult).toHaveBeenCalled();
      expect(catalogStore.invalidateCatalog).toHaveBeenCalledWith('beds');
      expect(component.mode()).toBe('IDLE');
      expect(component.patientForm.controls.document.value).toBe('');
      expect(component.authEntries()).toEqual([]);
    });

    it('does not re-fire the success feedback nor reset the form on a later patient search', async () => {
      await fillValidForm();
      store.isCreating.set(true);
      component.onSubmit();
      store.isCreating.set(false);
      store.createResult.set({
        admissionNumber: '2026-000001',
        patient: { id: 7, documentTypeId: 1, document: '1020304050' },
        admission: { id: 11 },
      });
      await flushEffects();

      store.clearCreateResult.mockClear();
      component.patientForm.patchValue({ documentTypeId: 1, document: '555666777' });
      component.onSearchPatient();
      await flushEffects();

      expect(component.feedback()).toBeNull();
      expect(store.clearCreateResult).toHaveBeenCalledTimes(0);
      expect(component.mode()).toBe('SEARCHING');
      expect(component.patientForm.controls.document.value).toBe('555666777');
    });

    it('shows the server error on failure', async () => {
      await fillValidForm();
      store.isCreating.set(true);
      component.onSubmit();
      store.isCreating.set(false);
      store.createError.set(
        new HttpErrorResponse({
          status: 409,
          statusText: 'Conflict',
          error: { message: 'La cama seleccionada no está disponible' },
        }),
      );
      await flushEffects();

      expect(component.feedback()).toEqual({
        type: 'error',
        message: 'La cama seleccionada no está disponible',
      });
    });
  });

  describe('required marks', () => {
    // Orden de aparición en el template: 0 paciente Tipo Documento, 1 Género,
    // 2 Tipo Usuario, 3 acompañante Tipo Documento, 4 Parentesco, 5 EPS, 6 Cama.
    function selectAt(index: number): MockCatalogSelectComponent {
      return fixture.debugElement.queryAll(By.css('app-catalog-select'))[index]
        .componentInstance as MockCatalogSelectComponent;
    }

    async function goToNotFound(): Promise<void> {
      component.patientForm.patchValue({ documentTypeId: 1, document: '999999999' });
      component.onSearchPatient();
      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.lookupError.set(
        new HttpErrorResponse({
          status: 404,
          statusText: 'Not Found',
          error: { message: 'Paciente no encontrado' },
        }),
      );
      await flushEffects();
    }

    it('marks Género and Tipo Usuario as required only when the patient is not found', async () => {
      expect(component.mode()).toBe('IDLE');
      expect(selectAt(1).required()).toBe(false);
      expect(selectAt(2).required()).toBe(false);

      await goToNotFound();

      expect(component.mode()).toBe('NOT_FOUND');
      expect(selectAt(1).required()).toBe(true);
      expect(selectAt(2).required()).toBe(true);
    });

    it('marks companion Tipo Documento and Parentesco required only while the name has data', async () => {
      expect(selectAt(3).required()).toBe(false);
      expect(selectAt(4).required()).toBe(false);

      component.companionForm.patchValue({ firstName: 'Luis' });
      await flushEffects();

      expect(selectAt(3).required()).toBe(true);
      expect(selectAt(4).required()).toBe(true);

      component.companionForm.patchValue({ firstName: '' });
      await flushEffects();

      expect(selectAt(3).required()).toBe(false);
      expect(selectAt(4).required()).toBe(false);
    });
  });

  describe('authorizations button', () => {
    it('stays disabled until the patient search completes and disables again on cancel', async () => {
      expect(component.mode()).toBe('IDLE');
      expect(component.dataEnabled()).toBe(false);

      component.patientForm.patchValue({ documentTypeId: 1, document: '1020304050' });
      component.onSearchPatient();
      expect(component.dataEnabled()).toBe(false);

      store.isLookingUp.set(true);
      store.isLookingUp.set(false);
      store.patientFound.set(patient);
      await flushEffects();
      expect(component.mode()).toBe('FOUND');
      expect(component.dataEnabled()).toBe(true);

      component.onCancel();
      expect(component.mode()).toBe('IDLE');
      expect(component.dataEnabled()).toBe(false);
    });

    it('cancel also clears the forms and the registered authorizations', () => {
      component.mode.set('FOUND');
      component.patientForm.patchValue({
        documentTypeId: 1,
        document: '1020304050',
        firstName: 'Ana',
      });
      component.companionForm.patchValue({ firstName: 'Luis' });
      component.appendAuthEntries([
        {
          authTypeId: 5,
          authNumber: 'AUTH-001',
          feeScheduleId: 2,
          mapiissCode: 'MAPIISS-1',
          quantity: 2,
          description: 'Consulta',
          observaciones: '',
          maxQuantity: 3,
        },
      ]);

      component.onCancel();

      expect(component.mode()).toBe('IDLE');
      expect(component.patientForm.controls.document.value).toBe('');
      expect(component.patientForm.controls.firstName.value).toBe('');
      expect(component.companionForm.controls.firstName.value).toBe('');
      expect(component.authEntries()).toEqual([]);
      expect(component.dataEnabled()).toBe(false);
    });
  });
});
