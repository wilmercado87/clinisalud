import { Component, forwardRef, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AdmissionSearchComponent } from '@shared/components/admission-search/admission-search.component';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { PatientInfoCardComponent } from '@shared/components/patient-info-card/patient-info-card.component';
import { PatientRegistrationComponent } from '@shared/components/patient-registration/patient-registration.component';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { PatientForm } from '@shared/utils/patient/patient-form.types';
import { TriageStore } from '@features/triage/store/triage.store';
import { TriageFormComponent } from './triage-form.component';

@Component({
  selector: 'app-admission-search',
  standalone: true,
  template: '',
})
class MockAdmissionSearchComponent {
  readonly documentTypeIdControl = input.required<FormControl<number | null>>();
  readonly documentControl = input.required<FormControl<string>>();
  readonly isSearching = input(false);
  readonly searchDisabled = input(false);
  readonly documentErrorMessage = input<string | null>(null);
  readonly resetToken = input(0);
}

@Component({
  selector: 'app-catalog-select',
  standalone: true,
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MockCatalogSelectComponent), multi: true }],
})
class MockCatalogSelectComponent implements ControlValueAccessor {
  readonly catalogType = input.required<string>();
  readonly label = input('');
  readonly required = input(false);
  readonly clearable = input(true);

  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
  setDisabledState(): void {}
  forceReset(): void {}
}

@Component({
  selector: 'app-patient-info-card',
  standalone: true,
  template: '',
})
class MockPatientInfoCardComponent {
  readonly patient = input.required<PatientLookupResponse>();
}

@Component({
  selector: 'app-patient-registration',
  standalone: true,
  template: '',
})
class MockPatientRegistrationComponent {
  readonly patientForm = input.required<PatientForm>();
  readonly required = input(false);
  readonly errors = input<Record<string, string | null>>({});
}

describe('TriageFormComponent', () => {
  let fixture: ComponentFixture<TriageFormComponent>;
  let component: TriageFormComponent;
  let store: MockTriageStore;

  class MockTriageStore {
    readonly isLookingUp = jest.fn().mockReturnValue(false);
    readonly lookupError = jest.fn().mockReturnValue(undefined);
    readonly patientFound = jest.fn().mockReturnValue(undefined);
    readonly isCreating = jest.fn().mockReturnValue(false);
    readonly createResult = jest.fn().mockReturnValue(null);
    readonly createError = jest.fn().mockReturnValue(undefined);

    lookupPatient = jest.fn();
    createTriage = jest.fn();
    clearCreateResult = jest.fn();
  }

  beforeEach(async () => {
    store = new MockTriageStore();
    await TestBed.configureTestingModule({
      imports: [TriageFormComponent],
      providers: [
        { provide: TriageStore, useValue: store },
        { provide: MatDialog, useValue: { open: jest.fn() } },
      ],
    })
      .overrideComponent(TriageFormComponent, {
        remove: {
          imports: [
            AdmissionSearchComponent,
            CatalogSelectComponent,
            PatientInfoCardComponent,
            PatientRegistrationComponent,
          ],
        },
        add: {
          imports: [
            ReactiveFormsModule,
            MockAdmissionSearchComponent,
            MockCatalogSelectComponent,
            MockPatientInfoCardComponent,
            MockPatientRegistrationComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TriageFormComponent);
    component = fixture.componentInstance;
    await TestBed.flushEffects();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('disables the submit button while idle', () => {
    const button = fixture.nativeElement.querySelector('.triage-form__actions button.mat-mdc-raised-button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
