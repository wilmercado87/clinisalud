import { Component, inject, effect, computed, ChangeDetectionStrategy, signal, ViewChildren, QueryList, DestroyRef, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import {
  ADMISSION_ERROR_RULES,
  applyRequiredValidators,
  AUTH_ERROR_RULES,
  COMPANION_ERROR_RULES,
  COMPANION_FORMAT_VALIDATORS,
  COMPANION_REQUIRED_KEYS,
  createPatientFormatValidators,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from '@features/admissions/utils/admission-form-validator';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { PatientLookupResponse } from '@features/admissions/models/admissions.model';
import { ToastService } from '@core/services/toast.service';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { startOfToday } from '@shared/utils/form-validators';
import { HTTP_STATUS } from '@shared/utils/status.codes';
import { getHttpErrorMessage, getHttpErrorStatus } from '@shared/utils/http-error';
import { patientToFormValue } from '@features/admissions/utils/admission.mapper';
import { calculateAge } from '@shared/utils/date-utils';
import {
  AdmissionForm,
  AdmissionFormValue,
  AuthFormGroup,
  CompanionForm,
  CompanionFormValue,
  FormMode,
  PatientForm,
  PatientFormValue,
} from '@features/admissions/utils/admission-form.types';
import {
  createAdmissionForm,
  createAuthEntryForm,
  createCompanionForm,
  createPatientForm,
} from '@features/admissions/utils/admission-form.factory';
import {
  applyAdmissionFormState,
  buildAdmissionRequest,
} from '@features/admissions/utils/admission-form.builder';

@Component({
  selector: 'app-admission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CatalogSelectComponent,
  ],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionFormComponent {
  private readonly store = inject(AdmissionStore);
  private readonly catalogStore = inject(CatalogStore);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  readonly today = startOfToday();

  private readonly patientFormatValidators = createPatientFormatValidators(this.today);

  readonly mode = signal<FormMode>('IDLE');
  private lookupRequested = false;

  readonly searchEnabled = computed(() => this.mode() === 'IDLE' || this.mode() === 'NOT_FOUND');
  readonly dataEnabled = computed(() => this.mode() === 'NOT_FOUND' || this.mode() === 'FOUND');

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;

  readonly showAuthorizations = signal(false);
  readonly authEntries = signal<AuthFormGroup[]>([]);
  readonly companionActive = signal(false);

  private readonly authRevision = signal(0);

  readonly patientForm: PatientForm = createPatientForm(this.today);
  readonly companionForm: CompanionForm = createCompanionForm();
  readonly admissionForm: AdmissionForm = createAdmissionForm();

  private authFormArray: AuthFormGroup[] = [];

  private readonly patientStatus: Signal<string>;
  private readonly patientValue: Signal<Partial<PatientFormValue>>;
  private readonly companionStatus: Signal<string>;
  private readonly companionValue: Signal<Partial<CompanionFormValue>>;
  private readonly admissionStatus: Signal<string>;
  private readonly admissionValue: Signal<Partial<AdmissionFormValue>>;

  readonly patientErrors = computed(() => {
    this.patientStatus();
    this.patientValue();
    return extractFieldErrors(this.patientForm, PATIENT_ERROR_RULES);
  });

  readonly companionErrors = computed(() => {
    this.companionStatus();
    this.companionValue();
    return extractFieldErrors(this.companionForm, COMPANION_ERROR_RULES);
  });

  readonly admissionErrors = computed(() => {
    this.admissionStatus();
    this.admissionValue();
    return extractFieldErrors(this.admissionForm, ADMISSION_ERROR_RULES);
  });

  readonly authErrors = computed(() => {
    this.authRevision();
    return this.authEntries().map((fg) => extractFieldErrors(fg, AUTH_ERROR_RULES));
  });

  readonly canSubmit = computed(() =>
    this.dataEnabled() &&
    this.patientStatus() === 'VALID' &&
    this.companionStatus() === 'VALID' &&
    this.admissionStatus() === 'VALID' &&
    (!this.showAuthorizations() || this.authFormArray.every((fg) => fg.valid)) &&
    !this.isCreating()
  );

  constructor() {
    this.patientStatus = toSignal(this.patientForm.statusChanges, { initialValue: this.patientForm.status });
    this.patientValue = toSignal(this.patientForm.valueChanges, { initialValue: this.patientForm.getRawValue() });
    this.companionStatus = toSignal(this.companionForm.statusChanges, { initialValue: this.companionForm.status });
    this.companionValue = toSignal(this.companionForm.valueChanges, { initialValue: this.companionForm.getRawValue() });
    this.admissionStatus = toSignal(this.admissionForm.statusChanges, { initialValue: this.admissionForm.status });
    this.admissionValue = toSignal(this.admissionForm.valueChanges, { initialValue: this.admissionForm.getRawValue() });
    this.applyFormState();
    this.registerEffects();
    this.subscribeToFormChanges();
  }

  private subscribeToFormChanges(): void {
    this.companionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshCompanionValidators());

    this.patientForm.controls.birthDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date: Date | string | null) => this.syncAgeFromBirthDate(date));
  }

  private registerEffects(): void {
    effect(() => {
      applyRequiredValidators(
        this.patientForm,
        PATIENT_REQUIRED_KEYS,
        this.patientFormatValidators,
        this.mode() === 'NOT_FOUND',
      );
    });

    effect(() => this.watchPatientLookup());
    effect(() => this.watchCreateResult());
    effect(() => this.watchCreateError());
  }

  private watchPatientLookup(): void {
    const isLookingUp = this.store.isLookingUp();
    const err = this.store.lookupError();
    const patient = this.store.patientFound();

    if (!this.lookupRequested || isLookingUp) return;
    this.lookupRequested = false;

    if (err) {
      this.handleLookupError(err);
      return;
    }

    if (patient) {
      this.fillPatientData(patient);
      return;
    }

    this.mode.set('NOT_FOUND');
    this.applyFormState();
  }

  private handleLookupError(err: unknown): void {
    if (getHttpErrorStatus(err) === HTTP_STATUS.NOT_FOUND) {
      this.mode.set('NOT_FOUND');
      this.applyFormState();
      return;
    }
    this.mode.set('IDLE');
    this.toast.error(getHttpErrorMessage(err, 'Error al buscar el paciente'));
    this.applyFormState();
  }

  private fillPatientData(patient: PatientLookupResponse): void {
    this.mode.set('FOUND');
    this.patientForm.patchValue(patientToFormValue(patient));
    this.admissionForm.patchValue({ epsId: patient.epsId ?? null });
    this.applyFormState();
  }

  private watchCreateResult(): void {
    const result = this.createResult();
    if (result && 'admissionNumber' in result) {
      this.toast.success(`Admisión ${result.admissionNumber} registrada correctamente`);
      this.catalogStore.invalidateCatalog('beds');
      this.resetAll();
    }
  }

  private watchCreateError(): void {
    const err = this.createError();
    if (err) {
      this.toast.error(getHttpErrorMessage(err, 'Error al registrar admisión'));
    }
  }

  onSearchPatient(): void {
    const docTypeId = this.patientForm.controls.documentTypeId.value;
    const doc = this.patientForm.controls.document.value?.trim();
    if (!docTypeId || !doc) {
      this.toast.info('Seleccione tipo de documento e ingrese número');
      return;
    }

    this.mode.set('SEARCHING');
    this.applyFormState();
    this.lookupRequested = true;
    this.store.lookupPatient(docTypeId, doc);
  }

  onDocumentBlur(): void {
    if (this.mode() !== 'IDLE') return;
    const doc = this.patientForm.controls.document.value?.trim();
    if (!doc) return;
    setTimeout(() => {
      if (this.mode() === 'IDLE') this.onSearchPatient();
    }, 150);
  }

  onCancel(): void {
    this.resetAll();
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      this.toast.info('Complete los campos requeridos para registrar la admisión');
      return;
    }

    const isNew = this.mode() === 'NOT_FOUND';
    this.store.createAdmission(
      buildAdmissionRequest({
        isNewPatient: isNew,
        patient: this.patientForm.getRawValue(),
        admission: this.admissionForm.getRawValue(),
        companion: this.companionForm.getRawValue(),
        authForms: this.authFormArray,
        authorizationsEnabled: this.showAuthorizations(),
      }),
    );
  }

  addAuthEntry(): void {
    const fg = createAuthEntryForm();
    fg.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.bumpAuthRevision());
    fg.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.bumpAuthRevision());
    this.authFormArray.push(fg);
    this.authEntries.set([...this.authFormArray]);
    this.bumpAuthRevision();
  }

  removeAuthEntry(index: number): void {
    this.authFormArray.splice(index, 1);
    this.authEntries.set([...this.authFormArray]);
    this.bumpAuthRevision();
  }

  toggleAuthorizations(checked: boolean): void {
    this.showAuthorizations.set(checked);
    this.bumpAuthRevision();
  }

  private bumpAuthRevision(): void {
    this.authRevision.update((n) => n + 1);
  }

  private syncAgeFromBirthDate(date: Date | string | null): void {
    this.patientForm.controls.age.setValue(calculateAge(date), { emitEvent: false });
  }

  private applyFormState(): void {
    applyAdmissionFormState(
      { patient: this.patientForm, companion: this.companionForm, admission: this.admissionForm },
      this.mode(),
    );
  }

  private refreshCompanionValidators(): void {
    const firstName = this.companionForm.controls.firstName.value?.trim();
    const lastName = this.companionForm.controls.lastName.value?.trim();
    const active = Boolean(firstName || lastName);
    this.companionActive.set(active);
    applyRequiredValidators(
      this.companionForm,
      COMPANION_REQUIRED_KEYS,
      COMPANION_FORMAT_VALIDATORS,
      active,
    );
  }

  private resetAll(): void {
    this.patientForm.reset();
    this.companionForm.reset();
    this.admissionForm.reset();
    this.catalogSelects?.forEach((select) => select.forceReset());
    this.showAuthorizations.set(false);
    this.authFormArray = [];
    this.authEntries.set([]);
    this.bumpAuthRevision();
    this.mode.set('IDLE');
    this.applyFormState();
  }
}
