import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
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
import { formatBedLabel, toAuthRowViewModel } from '@shared/utils/catalog-mapper';
import { ADMISSION_MESSAGES, formatMessage } from '@shared/utils/messages';
import {
  AdmissionAuthorization,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';
import { startOfToday } from '@shared/utils/form-validators';
import { HTTP_STATUS } from '@shared/utils/status.codes';
import { getHttpErrorMessage, getHttpErrorStatus } from '@shared/utils/http-error';
import { patientToFormValue } from '@features/admissions/utils/admission.mapper';
import { calculateAge } from '@shared/utils/date-utils';
import { trackFormSignals } from '@shared/utils/form-tracking';
import {
  AdmissionForm,
  AdmissionFormValue,
  AuthFormGroup,
  AuthFormValue,
  CompanionForm,
  CompanionFormValue,
  FormFeedback,
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
  buildUpdateAdmissionRequest,
  hasPendingAdmissionChanges,
} from '@features/admissions/utils/admission-form.builder';

@Injectable()
export class AdmissionFormFacade {
  private readonly store = inject(AdmissionStore);
  private readonly catalogStore = inject(CatalogStore);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = startOfToday();

  readonly patientForm: PatientForm = createPatientForm(this.today);
  readonly companionForm: CompanionForm = createCompanionForm();
  readonly admissionForm: AdmissionForm = createAdmissionForm();

  readonly mode = signal<FormMode>('IDLE');
  readonly feedback = signal<FormFeedback | null>(null);
  readonly authEntries = signal<AuthFormGroup[]>([]);
  readonly existingAuthorizations = signal<AdmissionAuthorization[]>([]);
  readonly companionActive = signal(false);
  readonly resetToken = signal(0);

  readonly patientFormSignals = trackFormSignals<PatientFormValue>(this.patientForm);
  readonly companionFormSignals = trackFormSignals<CompanionFormValue>(this.companionForm);
  readonly admissionFormSignals = trackFormSignals<AdmissionFormValue>(this.admissionForm);

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;

  readonly isUpdating = this.store.isUpdating;
  readonly updateResult = this.store.updateResult;
  readonly updateError = this.store.updateError;

  readonly activeAdmission = computed(() => this.store.patientFound()?.activeAdmission ?? null);

  readonly searchEnabled = computed(() => this.mode() === 'IDLE' || this.mode() === 'NOT_FOUND');
  readonly dataEnabled = computed(() => this.mode() === 'NOT_FOUND' || this.mode() === 'FOUND');

  readonly isUpdatingMode = computed(() => this.mode() === 'FOUND' && !!this.activeAdmission());

  readonly occupiedBedLabel = computed(() =>
    formatBedLabel(
      this.catalogStore.getCatalog('beds'),
      this.activeAdmission()?.roomId ?? null,
    ),
  );

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

  readonly existingAuthRows = computed(() =>
    this.existingAuthorizations().map((auth) =>
      toAuthRowViewModel(this.catalogStore.getCatalog('authorization-types'), {
        authTypeId: auth.authTypeId,
        authTypeName: auth.authTypeName ?? null,
        authNumber: auth.authNumber,
        mapiissCode: auth.mapiissCode,
        quantity: auth.quantity,
      }),
    ),
  );

  readonly newAuthRows = computed(() =>
    this.authEntries().map((fg) => {
      const values = fg.getRawValue();
      return toAuthRowViewModel(this.catalogStore.getCatalog('authorization-types'), {
        authTypeId: values.authTypeId,
        authNumber: values.authNumber,
        mapiissCode: values.mapiissCode,
        quantity: values.quantity ?? 1,
      });
    }),
  );

  readonly hasPendingChanges = computed(() => {
    if (this.authEntries().length > 0) return true;
    return hasPendingAdmissionChanges({
      roomId: this.admissionFormSignals.value().roomId ?? null,
      currentRoomId: this.activeAdmission()?.roomId ?? null,
      observations: this.admissionFormSignals.value().observations ?? '',
      currentObservations: this.activeAdmission()?.observations ?? '',
    });
  });

  readonly canSubmit = computed(() => {
    if (this.isUpdatingMode()) {
      return (
        this.hasPendingChanges() &&
        this.authEntries().every((fg) => fg.valid) &&
        !this.isCreating() &&
        !this.isUpdating()
      );
    }
    return (
      this.dataEnabled() &&
      !this.activeAdmission() &&
      this.patientFormSignals.status() === 'VALID' &&
      this.companionFormSignals.status() === 'VALID' &&
      this.admissionFormSignals.status() === 'VALID' &&
      this.authEntries().every((fg) => fg.valid) &&
      !this.isCreating() &&
      !this.isUpdating()
    );
  });

  private readonly patientFormatValidators = createPatientFormatValidators(this.today);
  private lookupRequested = false;
  private readonly lastSearchKey = signal<string | null>(null);
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.applyFormState();
    this.registerEffects();
    this.subscribeToFormChanges();
    this.destroyRef.onDestroy(() => this.clearBlurTimer());
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
    if (this.isUpdatingMode()) {
      this.submitUpdate();
      return;
    }

    if (!this.canSubmit()) {
      this.setFeedback('info', ADMISSION_MESSAGES.REQUIRED_FIELDS);
      return;
    }

    if (this.activeAdmission()) {
      this.setFeedback('info', ADMISSION_MESSAGES.ACTIVE_ADMISSION_INFO);
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

  resetAll(): void {
    this.patientForm.reset();
    this.companionForm.reset();
    this.admissionForm.reset();
    this.authEntries.set([]);
    this.existingAuthorizations.set([]);
    this.mode.set('IDLE');
    this.lastSearchKey.set(null);
    this.resetToken.update((token) => token + 1);
    this.applyFormState();
  }

  private submitUpdate(): void {
    if (!this.canSubmit()) {
      this.setFeedback('info', ADMISSION_MESSAGES.UPDATE_REQUIRED_FIELDS);
      return;
    }

    const activeAdmission = this.activeAdmission();
    if (!activeAdmission) return;

    this.clearFeedback();
    this.store.updateAdmission(
      activeAdmission.admissionNumber,
      buildUpdateAdmissionRequest({
        roomId: this.admissionForm.controls.roomId.value,
        previousRoomId: activeAdmission.roomId,
        observations: this.admissionForm.controls.observations.value,
        previousObservations: activeAdmission.observations,
        authForms: this.authEntries(),
        authorizationsEnabled: this.authEntries().length > 0,
      }),
    );
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
    effect(() => this.watchUpdateResult());
    effect(() => this.watchUpdateError());
    effect(() => {
      this.mode();
      this.companionActive();
      this.patientForm.updateValueAndValidity();
      this.companionForm.updateValueAndValidity();
      this.admissionForm.updateValueAndValidity();
    });
  }

  private subscribeToFormChanges(): void {
    this.companionForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshCompanionValidators());

    this.patientForm.controls.birthDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((date: Date | string | null) => this.syncAgeFromBirthDate(date));
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

    const activeAdmission = patient.activeAdmission;
    if (activeAdmission) {
      this.admissionForm.patchValue({
        roomId: null,
        observations: activeAdmission.observations ?? '',
      });
      this.existingAuthorizations.set(activeAdmission.authorizations);
      if (this.feedback()?.type !== 'success') {
        this.setFeedback(
          'info',
          formatMessage(ADMISSION_MESSAGES.ACTIVE_ADMISSION_UPDATE_HINT, {
            admissionNumber: activeAdmission.admissionNumber,
          }),
        );
      }
    } else {
      this.admissionForm.patchValue({ roomId: null, observations: '' });
      this.existingAuthorizations.set([]);
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

  private watchUpdateResult(): void {
    const result = this.updateResult();
    if (result && 'admissionNumber' in result) {
      this.setFeedback(
        'success',
        formatMessage(ADMISSION_MESSAGES.ADMISSION_UPDATED, {
          admissionNumber: result.admissionNumber,
        }),
      );
      this.catalogStore.invalidateCatalog('beds');
      this.authEntries.set([]);
      this.store.clearUpdateResult();
      this.reloadCurrentPatient();
    }
  }

  private watchUpdateError(): void {
    const err = this.updateError();
    if (err) {
      this.setFeedback('error', getHttpErrorMessage(err, ADMISSION_MESSAGES.ADMISSION_UPDATE_ERROR));
    }
  }

  private reloadCurrentPatient(): void {
    const searchKey = this.lastSearchKey();
    if (!searchKey) return;
    const [documentTypeId, document] = searchKey.split('|');
    this.lookupRequested = true;
    this.store.lookupPatient(Number(documentTypeId), document);
  }

  private syncAgeFromBirthDate(date: Date | string | null): void {
    this.patientForm.controls.age.setValue(calculateAge(date), { emitEvent: false });
  }

  private applyFormState(): void {
    applyAdmissionFormState(
      { patient: this.patientForm, companion: this.companionForm, admission: this.admissionForm },
      this.mode(),
      this.isUpdatingMode(),
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

  private clearBlurTimer(): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
  }

  private setFeedback(type: FormFeedback['type'], message: string): void {
    this.feedback.set({ type, message });
  }

  private clearFeedback(): void {
    this.feedback.set(null);
  }
}
