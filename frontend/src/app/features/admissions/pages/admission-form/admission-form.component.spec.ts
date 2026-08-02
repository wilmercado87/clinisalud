import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdmissionFormComponent } from './admission-form.component';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { PatientLookupResponse } from '@features/admissions/models/admissions.model';

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

  lookupPatient = jasmine.createSpy('lookupPatient');
  createAdmission = jasmine.createSpy('createAdmission');
  clearCreateResult = jasmine.createSpy('clearCreateResult');
}

describe('AdmissionFormComponent', () => {
  let component: AdmissionFormComponent;
  let fixture: ComponentFixture<AdmissionFormComponent>;
  let store: MockAdmissionStore;
  let catalogStore: { invalidateCatalog: jasmine.Spy };

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
    store.clearCreateResult = jasmine.createSpy('clearCreateResult').and.callFake(() => {
      store.createResult.set(null);
    });
    catalogStore = { invalidateCatalog: jasmine.createSpy('invalidateCatalog') };

    await TestBed.configureTestingModule({
      imports: [AdmissionFormComponent],
      providers: [
        { provide: AdmissionStore, useValue: store },
        { provide: CatalogStore, useValue: catalogStore },
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
      expect(component.patientForm.controls.firstName.enabled).toBeTrue();
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

      expect(component['patientStatus']()).toBe('VALID');
      expect(component['admissionStatus']()).toBe('VALID');
      expect(component.canSubmit()).toBeTrue();

      component.onSubmit();
      expect(store.createAdmission).toHaveBeenCalledWith(
        jasmine.objectContaining({
          isNewPatient: false,
          documentTypeId: 1,
          document: '1020304050',
        }),
      );
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
      expect(component.canSubmit()).toBeTrue();

      component.onSubmit();

      expect(store.createAdmission).toHaveBeenCalledWith(
        jasmine.objectContaining({
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

      const payload = store.createAdmission.calls.mostRecent().args[0];
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
      component.toggleAuthorizations(true);
      component.addAuthEntry();
      component.authEntries()[0].patchValue({
        authTypeId: 5,
        authNumber: 'AUTH-001',
        mapiissCode: 'MAPIISS-1',
        quantity: 2,
      });
      await flushEffects();

      component.onSubmit();

      const payload = store.createAdmission.calls.mostRecent().args[0];
      expect(payload.authorizations).toEqual([
        { authTypeId: 5, authNumber: 'AUTH-001', mapiissCode: 'MAPIISS-1', quantity: 2 },
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
      expect(component.showAuthorizations()).toBeFalse();
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

      store.clearCreateResult.calls.reset();
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
});
