import { computed, DestroyRef, effect, inject, Injectable, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { DiagnosticoResponse } from '@core/models/catalog.model';
import {
  DiagnosticSearchDialogComponent,
  DiagnosticSearchDialogData,
} from '@features/triage/components/diagnostic-search-dialog/diagnostic-search-dialog.component';
import { TriageStore } from '@features/triage/store/triage.store';
import { applyTriageFormState, buildTriageRequest } from '@features/triage/utils/triage-form.builder';
import { createTriageForm } from '@features/triage/utils/triage-form.factory';
import { TRIAGE_ERROR_RULES, TriageForm, TriageFormValue } from '@features/triage/utils/triage-form.types';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { createFormFeedback, FormFeedback } from '@shared/utils/form-feedback';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { trackFormSignals } from '@shared/utils/form-tracking';
import { startOfToday } from '@shared/utils/form-validators';
import { calculateAge } from '@shared/utils/date-utils';
import { getHttpErrorMessage, getHttpErrorStatus } from '@shared/utils/http-error';
import { TRIAGE_MESSAGES } from '@shared/utils/messages';
import { HTTP_STATUS } from '@shared/utils/status.codes';
import {
  applyRequiredValidators,
  createPatientFormatValidators,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from '@shared/utils/patient/patient-form.validator';
import { createPatientForm } from '@shared/utils/patient/patient-form.factory';
import type { FormMode, PatientForm, PatientFormValue } from '@shared/utils/patient/patient-form.types';
import { patientToFormValue } from '@shared/utils/patient/patient.mapper';

@Injectable()
export class TriageFormFacade {
  private readonly store = inject(TriageStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly today = startOfToday();

  readonly patientForm: PatientForm = createPatientForm(this.today);
  readonly triageForm: TriageForm = createTriageForm();

  readonly mode = signal<FormMode>('IDLE');
  readonly resetToken = signal(0);
  readonly selectedDiagnostic = signal<DiagnosticoResponse | null>(null);
  readonly attentionDate = signal<string>('');

  private readonly feedbackController = createFormFeedback();
  readonly feedback: Signal<FormFeedback | null> = this.feedbackController.signal;

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;

  readonly patientFound = computed(() => this.store.patientFound());

  readonly diagnosticLabel = computed(() => {
    const diagnostic = this.selectedDiagnostic();
    return diagnostic ? `${diagnostic.code} - ${diagnostic.description}` : '';
  });

  readonly searchEnabled = computed(() => this.mode() === 'IDLE' || this.mode() === 'NOT_FOUND');
  readonly dataEnabled = computed(() => this.mode() === 'NOT_FOUND' || this.mode() === 'FOUND');

  readonly patientFormSignals = trackFormSignals<PatientFormValue>(this.patientForm);
  readonly triageFormSignals = trackFormSignals<TriageFormValue>(this.triageForm);

  readonly patientErrors = computed(() => {
    this.patientFormSignals.status();
    this.patientFormSignals.value();
    return extractFieldErrors(this.patientForm, PATIENT_ERROR_RULES);
  });

  readonly triageErrors = computed(() => {
    this.triageFormSignals.status();
    this.triageFormSignals.value();
    return extractFieldErrors(this.triageForm, TRIAGE_ERROR_RULES);
  });

  readonly patientFormValid = computed(() => {
    if (this.mode() === 'FOUND') return true;
    return this.patientFormSignals.status() === 'VALID';
  });

  readonly canRegister = computed(() =>
    this.dataEnabled() &&
    this.patientFormValid() &&
    this.triageFormSignals.status() === 'VALID' &&
    !this.isCreating(),
  );

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
      this.feedbackController.set('info', TRIAGE_MESSAGES.PATIENT_LOOKUP_INVALID_INPUT);
      return;
    }

    const searchKey = `${docTypeId}|${doc}`;
    if (this.lastSearchKey() === searchKey) return;

    this.lastSearchKey.set(searchKey);

    this.feedbackController.clear();
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

  async openDiagnosticSearch(): Promise<void> {
    const dialogRef = this.dialog.open(DiagnosticSearchDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { currentDiagnosticId: this.triageForm.controls.diagnosticId.value } satisfies DiagnosticSearchDialogData,
    });

    const result = await firstValueFrom(
      dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)),
    );
    if (!result) return;
    this.triageForm.controls.diagnosticId.setValue((result as DiagnosticoResponse).id);
    this.selectedDiagnostic.set(result as DiagnosticoResponse);
  }

  onCancel(): void {
    this.feedbackController.clear();
    this.lastSearchKey.set(null);
    this.resetAll();
  }

  onSubmit(): void {
    if (!this.canRegister()) {
      this.feedbackController.set('info', TRIAGE_MESSAGES.REQUIRED_FIELDS);
      return;
    }

    this.feedbackController.clear();
    this.store.createTriage(
      buildTriageRequest({
        isNewPatient: this.mode() === 'NOT_FOUND',
        patient: this.patientForm.getRawValue(),
        triage: this.triageForm.getRawValue(),
      }),
    );
  }

  resetAll(): void {
    this.patientForm.reset();
    this.triageForm.reset();
    this.selectedDiagnostic.set(null);
    this.mode.set('IDLE');
    this.lastSearchKey.set(null);
    this.attentionDate.set('');
    this.resetToken.update((token) => token + 1);
    this.applyFormState();
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
      this.triageForm.updateValueAndValidity();
    });
  }

  private subscribeToFormChanges(): void {
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
    this.attentionDate.set(formatNow());
    this.applyFormState();
  }

  private handleLookupError(err: unknown): void {
    if (getHttpErrorStatus(err) === HTTP_STATUS.NOT_FOUND) {
      this.mode.set('NOT_FOUND');
      this.attentionDate.set(formatNow());
      this.applyFormState();
      return;
    }
    this.mode.set('IDLE');
    this.feedbackController.set('error', getHttpErrorMessage(err, TRIAGE_MESSAGES.PATIENT_LOOKUP_ERROR));
    this.applyFormState();
  }

  private fillPatientData(patient: PatientLookupResponse): void {
    this.mode.set('FOUND');
    this.patientForm.patchValue(patientToFormValue(patient));
    this.triageForm.patchValue({ epsId: patient.epsId ?? null });
    this.attentionDate.set(formatNow());
    this.applyFormState();
  }

  private watchCreateResult(): void {
    const result = this.createResult();
    if (!result || !('triage' in result)) return;
    this.feedbackController.set('success', TRIAGE_MESSAGES.TRIAGE_CREATED);
    this.resetAll();
    this.store.clearCreateResult();
  }

  private watchCreateError(): void {
    const err = this.createError();
    if (err) {
      this.feedbackController.set('error', getHttpErrorMessage(err, TRIAGE_MESSAGES.TRIAGE_CREATE_ERROR));
    }
  }

  private syncAgeFromBirthDate(date: Date | string | null): void {
    this.patientForm.controls.age.setValue(calculateAge(date), { emitEvent: false });
  }

  private applyFormState(): void {
    applyTriageFormState({ patient: this.patientForm, triage: this.triageForm }, this.mode());
  }

  private clearBlurTimer(): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
  }
}

function formatNow(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  );
}
