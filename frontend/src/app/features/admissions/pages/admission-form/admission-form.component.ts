import {
  Component,
  inject,
  effect,
  computed,
  ChangeDetectionStrategy,
  signal,
  ViewChildren,
  QueryList,
  DestroyRef,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import {
  ADMISSION_ERROR_RULES,
  applyRequiredValidators,
  COMPANION_ERROR_RULES,
  COMPANION_FORMAT_VALIDATORS,
  COMPANION_REQUIRED_KEYS,
  createPatientFormatValidators,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from '@features/admissions/utils/admission-form-validator';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { findCatalogItemName } from '@shared/utils/catalog-mapper';
import { ADMISSION_MESSAGES, formatMessage } from '@shared/utils/messages';
import { PatientLookupResponse } from '@features/admissions/models/admissions.model';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { AuthEntryDialogComponent } from '@features/admissions/components/auth-entry-dialog/auth-entry-dialog.component';
import { startOfToday } from '@shared/utils/form-validators';
import { HTTP_STATUS } from '@shared/utils/status.codes';
import { getHttpErrorMessage, getHttpErrorStatus } from '@shared/utils/http-error';
import { patientToFormValue } from '@features/admissions/utils/admission.mapper';
import { calculateAge } from '@shared/utils/date-utils';
import {
  AdmissionForm,
  AdmissionFormValue,
  AuthFormGroup,
  AuthFormValue,
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

export type FormFeedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

interface TrackableForm<TValue> {
  status: string;
  statusChanges: Observable<string>;
  getRawValue(): TValue;
  valueChanges: Observable<Partial<TValue>>;
}

interface FormTrackSignals<TValue> {
  status: Signal<string>;
  value: Signal<Partial<TValue>>;
}

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
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    CatalogSelectComponent,
    RouterModule,
  ],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionFormComponent {
  private readonly store = inject(AdmissionStore);
  private readonly catalogStore = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  readonly today = startOfToday();

  private readonly patientFormatValidators = createPatientFormatValidators(this.today);

  readonly mode = signal<FormMode>('IDLE');
  private lookupRequested = false;
  private readonly lastSearchKey = signal<string | null>(null);

  readonly searchEnabled = computed(() => this.mode() === 'IDLE' || this.mode() === 'NOT_FOUND');
  readonly dataEnabled = computed(() => this.mode() === 'NOT_FOUND' || this.mode() === 'FOUND');

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;

  readonly activeAdmission = computed(() => this.store.patientFound()?.activeAdmission ?? null);

  readonly feedback = signal<FormFeedback | null>(null);

  readonly authEntries = signal<AuthFormGroup[]>([]);
  readonly companionActive = signal(false);

  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  readonly patientForm: PatientForm = createPatientForm(this.today);
  readonly companionForm: CompanionForm = createCompanionForm();
  readonly admissionForm: AdmissionForm = createAdmissionForm();

  private patientFormSignals!: FormTrackSignals<PatientFormValue>;
  private companionFormSignals!: FormTrackSignals<CompanionFormValue>;
  private admissionFormSignals!: FormTrackSignals<AdmissionFormValue>;

  readonly patientErrors = computed(() => {
    this.patientFormSignals.status();
    this.patientFormSignals.value();
    return extractFieldErrors(this.patientForm, PATIENT_ERROR_RULES);
  });

  readonly companionErrors = computed(() => {
    this.companionFormSignals.status();
    this.companionFormSignals.value();
    return extractFieldErrors(this.companionForm, COMPANION_ERROR_RULES);
  });

  readonly admissionErrors = computed(() => {
    this.admissionFormSignals.status();
    this.admissionFormSignals.value();
    return extractFieldErrors(this.admissionForm, ADMISSION_ERROR_RULES);
  });

  readonly authRows = computed(() =>
    this.authEntries().map((fg) => {
      const values = fg.getRawValue();
      return {
        authTypeName: findCatalogItemName(
          this.catalogStore.getCatalog('authorization-types'),
          values.authTypeId,
        ),
        authNumber: values.authNumber,
        mapiissCode: values.mapiissCode,
        quantity: values.quantity,
      };
    }),
  );

  readonly canSubmit = computed(() =>
    this.dataEnabled() &&
    !this.activeAdmission() &&
    this.patientFormSignals.status() === 'VALID' &&
    this.companionFormSignals.status() === 'VALID' &&
    this.admissionFormSignals.status() === 'VALID' &&
    this.authEntries().every((fg) => fg.valid) &&
    !this.isCreating()
  );

  constructor() {
    this.initFormSignals();
    this.applyFormState();
    this.registerEffects();
    this.subscribeToFormChanges();
    this.destroyRef.onDestroy(() => this.clearBlurTimer());
  }

  private initFormSignals(): void {
    this.patientFormSignals = this.trackForm(this.patientForm);
    this.companionFormSignals = this.trackForm(this.companionForm);
    this.admissionFormSignals = this.trackForm(this.admissionForm);
  }

  private trackForm<TValue>(form: TrackableForm<TValue>): FormTrackSignals<TValue> {
    return {
      status: toSignal(form.statusChanges, { initialValue: form.status }),
      value: toSignal(form.valueChanges, { initialValue: form.getRawValue() }),
    };
  }

  private clearBlurTimer(): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
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
    effect(() => {
      this.mode();
      this.companionActive();
      this.patientForm.updateValueAndValidity();
      this.companionForm.updateValueAndValidity();
      this.admissionForm.updateValueAndValidity();
    });
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
    this.setFeedback('error', getHttpErrorMessage(err, ADMISSION_MESSAGES.PATIENT_LOOKUP_ERROR));
    this.applyFormState();
  }

  private fillPatientData(patient: PatientLookupResponse): void {
    this.mode.set('FOUND');
    this.patientForm.patchValue(patientToFormValue(patient));
    this.admissionForm.patchValue({ epsId: patient.epsId ?? null });
    this.applyFormState();

    if (patient.activeAdmission) {
      this.setFeedback(
        'error',
        formatMessage(ADMISSION_MESSAGES.ACTIVE_ADMISSION_EXISTS, {
          admissionNumber: patient.activeAdmission.admissionNumber,
        }),
      );
    }
  }

  private watchCreateResult(): void {
    const result = this.createResult();
    if (result && 'admissionNumber' in result) {
      this.setFeedback(
        'success',
        formatMessage(ADMISSION_MESSAGES.ADMISSION_CREATED, {
          admissionNumber: result.admissionNumber,
        }),
      );
      this.catalogStore.invalidateCatalog('beds');
      this.resetAll();
      this.store.clearCreateResult();
    }
  }

  private watchCreateError(): void {
    const err = this.createError();
    if (err) {
      this.setFeedback('error', getHttpErrorMessage(err, ADMISSION_MESSAGES.ADMISSION_CREATE_ERROR));
    }
  }

  onSearchPatient(): void {
    const docTypeId = this.patientForm.controls.documentTypeId.value;
    const doc = this.patientForm.controls.document.value?.trim();
    if (!docTypeId || !doc) {
      this.setFeedback('info', ADMISSION_MESSAGES.PATIENT_LOOKUP_INVALID_INPUT);
      return;
    }

    const searchKey = `${docTypeId}|${doc}`;
    if (this.lastSearchKey() === searchKey) return;

    this.lastSearchKey.set(searchKey);

    this.clearFeedback();
    this.mode.set('SEARCHING');
    this.applyFormState();
    this.lookupRequested = true;
    this.store.lookupPatient(docTypeId, doc);
  }

  onDocumentBlur(): void {
    const docTypeId = this.patientForm.controls.documentTypeId.value;
    const doc = this.patientForm.controls.document.value?.trim();
    if (!docTypeId || !doc) return;

    if (this.mode() !== 'IDLE' && this.mode() !== 'NOT_FOUND') return;

    this.clearBlurTimer();
    this.blurTimer = setTimeout(() => {
      this.blurTimer = null;
      if (this.mode() === 'IDLE' || this.mode() === 'NOT_FOUND') this.onSearchPatient();
    }, 150);
  }

  onCancel(): void {
    this.clearFeedback();
    this.lastSearchKey.set(null);
    this.resetAll();
  }

  onSubmit(): void {
    if (!this.canSubmit()) {
      this.setFeedback('info', ADMISSION_MESSAGES.REQUIRED_FIELDS);
      return;
    }

    if (this.activeAdmission()) {
      this.setFeedback('info', 'El paciente ya tiene una admisión activa');
      return;
    }

    this.clearFeedback();
    const isNew = this.mode() === 'NOT_FOUND';
    this.store.createAdmission(
      buildAdmissionRequest({
        isNewPatient: isNew,
        patient: this.patientForm.getRawValue(),
        admission: this.admissionForm.getRawValue(),
        companion: this.companionForm.getRawValue(),
        authForms: this.authEntries(),
        authorizationsEnabled: this.authEntries().length > 0,
      }),
    );
  }

  openAuthorizationsDialog(): void {
    const dialogRef = this.dialog.open(AuthEntryDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values?: AuthFormValue[]) => {
        if (!values || values.length === 0) return;
        this.appendAuthEntries(values);
      });
  }

  appendAuthEntries(values: AuthFormValue[]): void {
    const entries = values.map((value) => {
      const fg = createAuthEntryForm();
      fg.patchValue(value);
      return fg;
    });
    this.authEntries.update((list) => [...list, ...entries]);
  }

  removeAuthEntry(index: number): void {
    const fg = this.authEntries()[index];
    if (!fg) return;
    this.authEntries.update((list) => list.filter((_, i) => i !== index));
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
    this.authEntries.set([]);
    this.mode.set('IDLE');
    this.lastSearchKey.set(null);
    this.applyFormState();
  }

  private setFeedback(type: FormFeedback['type'], message: string): void {
    this.feedback.set({ type, message });
  }

  private clearFeedback(): void {
    this.feedback.set(null);
  }
}
