import { computed, effect, inject, Injectable, Signal, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { buildAuthorizationsRequest } from '@features/admissions/utils/admission/admission-form.builder';
import { queuedValuesToAuthorizations } from '@features/admissions/utils/admission/admission.mapper';
import {
  AdmissionAuthorization,
  PatientLookupResponse,
} from '@features/admissions/models/admissions.model';
import { AdmissionsService } from '@features/admissions/services/admissions.service';
import { createAuthorizationForm } from '@features/admissions/utils/authorization/authorization-form.factory';
import {
  AuthorizationFormGroup,
  AuthorizationFormValue,
} from '@features/admissions/utils/authorization/authorization-form.types';
import { formatBedLabel, findCatalogItemName, toAuthRowViewModel } from '@shared/utils/catalog-mapper';
import { resolveContractFeeSchedule } from '@features/admissions/utils/authorization/contract.util';
import { createFormFeedback, FormFeedback } from '@shared/utils/form-feedback';
import { getHttpErrorMessage, getHttpErrorStatus } from '@shared/utils/http-error';
import { ADMISSION_MESSAGES, AUTHORIZATIONS_MESSAGES, formatMessage } from '@shared/utils/messages';
import { HTTP_STATUS } from '@shared/utils/status.codes';

export type AuthorizationSearchMode = 'document' | 'admission';

export type ContractStatus = 'idle' | 'loading' | 'ready' | 'missing';

export interface DocumentSearchForm {
  documentTypeId: FormControl<number | null>;
  document: FormControl<string>;
}

export interface AdmissionNumberSearchForm {
  admissionNumber: FormControl<string>;
}

export interface EditingAuthEntry {
  index: number;
  value: AuthorizationFormValue;
}

@Injectable()
export class AuthorizationManagerFacade {
  private readonly api = inject(AdmissionsService);
  private readonly catalogStore = inject(CatalogStore);

  readonly documentForm = new FormGroup<DocumentSearchForm>({
    documentTypeId: new FormControl<number | null>(null, Validators.required),
    document: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly admissionNumberForm = new FormGroup<AdmissionNumberSearchForm>({
    admissionNumber: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly patient = signal<PatientLookupResponse | null>(null);
  readonly isSearching = signal(false);
  readonly isSaving = signal(false);
  readonly existingAuthorizations = signal<AdmissionAuthorization[]>([]);
  readonly queuedAuthForms = signal<AuthorizationFormGroup[]>([]);
  readonly editingEntry = signal<EditingAuthEntry | null>(null);

  private readonly feedbackController = createFormFeedback();
  readonly feedback: Signal<FormFeedback | null> = this.feedbackController.signal;

  readonly activeAdmission = computed(() => this.patient()?.activeAdmission ?? null);

  private readonly contractState = signal<{ status: ContractStatus; feeScheduleId: number | null }>({
    status: 'idle',
    feeScheduleId: null,
  });
  readonly contractStatus: Signal<ContractStatus> = computed(() => this.contractState().status);
  readonly contractFeeScheduleId: Signal<number | null> = computed(() => this.contractState().feeScheduleId);
  readonly contractWarningMessage: Signal<string | null> = computed(() =>
    this.contractStatus() === 'missing' ? AUTHORIZATIONS_MESSAGES.EPS_CONTRACT_TARIFF_MISSING : null,
  );

  readonly patientFullName = computed(() => {
    const patient = this.patient();
    if (!patient) return '';
    return `${patient.firstName} ${patient.lastName}`.trim();
  });

  readonly documentLabel = computed(() => {
    const patient = this.patient();
    if (!patient) return '';
    const typeCode = patient.documentType?.code ?? '';
    return `${typeCode} ${patient.document}`.trim();
  });

  readonly epsName = computed(() => {
    this.catalogStore.versionOf('eps');
    return findCatalogItemName(this.catalogStore.getCatalog('eps'), this.patient()?.epsId ?? null);
  });

  readonly bedLabel = computed(() => {
    this.catalogStore.versionOf('beds');
    return formatBedLabel(this.catalogStore.getCatalog('beds'), this.activeAdmission()?.roomId ?? null);
  });

  readonly existingAuthRows = computed(() => {
    this.catalogStore.versionOf('authorization-types');
    return this.existingAuthorizations().map((auth) =>
      toAuthRowViewModel(this.catalogStore.getCatalog('authorization-types'), {
        authTypeId: auth.authTypeId,
        authTypeName: auth.authTypeName ?? null,
        authNumber: auth.authNumber,
        mapiissCode: auth.mapiissCode,
        quantity: auth.quantity,
        mapiissDescription: auth.mapiissDescription ?? undefined,
      }),
    );
  });

  readonly queuedAuthRows = computed(() => {
    this.catalogStore.versionOf('authorization-types');
    return this.queuedAuthForms().map((fg) => {
      const values = fg.getRawValue();
      return toAuthRowViewModel(this.catalogStore.getCatalog('authorization-types'), {
        authTypeId: values.authTypeId,
        authNumber: values.authNumber,
        mapiissCode: values.mapiissCode,
        quantity: values.quantity ?? 1,
        mapiissDescription: values.mapiissDescription,
      });
    });
  });

  readonly queuedAuthValues = computed(() => this.queuedAuthForms().map((fg) => fg.getRawValue()));

  readonly canSave = computed(() => {
    const queue = this.queuedAuthForms();
    return (
      this.activeAdmission() !== null &&
      queue.length > 0 &&
      queue.every((fg) => fg.valid) &&
      !this.isSaving()
    );
  });

  constructor() {
    void this.loadCatalog('eps');
    void this.loadCatalog('beds');
    effect(() => {
      debugger;
      const epsId = this.patient()?.epsId ?? null;
      untracked(() => void this.resolveEpsContract(epsId));
    });
  }

  async onSearch(mode: AuthorizationSearchMode): Promise<void> {
    if (mode === 'document') {
      await this.searchByDocument();
      return;
    }
    await this.searchByAdmissionNumber();
  }

  onDocumentBlur(): void {
    const { documentTypeId, document } = this.documentForm.getRawValue();
    if (!documentTypeId || !document.trim()) return;
    void this.onSearch('document');
  }

  appendAuthEntries(values: AuthorizationFormValue[]): void {
    if (values.length === 0) return;
    const entries = values.map((value) => {
      const fg = createAuthorizationForm();
      fg.patchValue(value);
      return fg;
    });
    this.queuedAuthForms.update((list) => [...list, ...entries]);
    this.feedbackController.set('info', AUTHORIZATIONS_MESSAGES.AUTH_QUEUED);
  }

  removeAuthEntry(index: number): void {
    this.queuedAuthForms.update((list) => list.filter((_, i) => i !== index));
    const editing = this.editingEntry();
    if (editing && editing.index === index) this.editingEntry.set(null);
  }

  startEditAuthEntry(index: number): void {
    const fg = this.queuedAuthForms()[index];
    if (!fg) return;
    this.editingEntry.set({ index, value: fg.getRawValue() });
  }

  updateAuthEntry(index: number, value: AuthorizationFormValue): void {
    const fg = createAuthorizationForm();
    fg.patchValue(value);
    this.queuedAuthForms.update((list) => {
      const newList = [...list];
      newList[index] = fg;
      return newList;
    });
    this.editingEntry.set(null);
  }

  clearEditingEntry(): void {
    this.editingEntry.set(null);
  }

  async saveAuthorizations(): Promise<void> {
    const admission = this.activeAdmission();
    if (!admission) return;

    const queue = this.queuedAuthForms();
    if (queue.length === 0) {
      this.feedbackController.set('info', AUTHORIZATIONS_MESSAGES.NOTHING_TO_SAVE);
      return;
    }
    if (!queue.every((fg) => fg.valid)) return;

    this.feedbackController.clear();
    this.isSaving.set(true);
    try {
      await firstValueFrom(
        this.api.updateAdmission(admission.admissionNumber, {
          authorizations: buildAuthorizationsRequest(queue, true),
        }),
      );
      this.feedbackController.set(
        'success',
        formatMessage(AUTHORIZATIONS_MESSAGES.SAVE_SUCCESS, { admissionNumber: admission.admissionNumber }),
      );
      this.mergeQueueIntoExisting();
      this.clearQueue();
      await this.reloadCurrent(admission.admissionNumber);
    } catch (err) {
      this.feedbackController.set('error', getHttpErrorMessage(err, AUTHORIZATIONS_MESSAGES.SAVE_ERROR));
    } finally {
      this.isSaving.set(false);
    }
  }

  private mergeQueueIntoExisting(): void {
    const queued = this.queuedAuthForms().map((fg) => fg.getRawValue());
    if (queued.length === 0) return;
    this.existingAuthorizations.update((current) => [
      ...current,
      ...queuedValuesToAuthorizations(queued),
    ]);
  }

  resetAll(): void {
    this.documentForm.reset();
    this.admissionNumberForm.reset();
    this.resetResult();
    this.feedbackController.clear();
  }

  private async searchByDocument(): Promise<void> {
    const { documentTypeId, document } = this.documentForm.getRawValue();
    const trimmedDocument = document.trim();
    if (!documentTypeId || !trimmedDocument) {
      this.feedbackController.set('info', ADMISSION_MESSAGES.PATIENT_LOOKUP_INVALID_INPUT);
      return;
    }
    await this.executeSearch(() => this.api.lookupPatient({ documentTypeId, document: trimmedDocument }));
  }

  private async searchByAdmissionNumber(): Promise<void> {
    const { admissionNumber } = this.admissionNumberForm.getRawValue();
    const trimmed = admissionNumber.trim();
    if (!trimmed) {
      this.feedbackController.set('info', AUTHORIZATIONS_MESSAGES.ADMISSION_NUMBER_REQUIRED);
      return;
    }
    await this.executeSearch(() => this.api.getAdmissionByNumber(trimmed));
  }

  private async executeSearch(request: () => Observable<PatientLookupResponse>): Promise<void> {
    this.feedbackController.clear();
    this.isSearching.set(true);
    try {
      const patient = await firstValueFrom(request());
      this.applyPatient(patient);
    } catch (err) {
      this.handleSearchError(err);
    } finally {
      this.isSearching.set(false);
    }
  }

  private applyPatient(patient: PatientLookupResponse): void {
    this.patient.set(patient);
    this.existingAuthorizations.set(patient.activeAdmission?.authorizations ?? []);
    this.clearQueue();
    if (!patient.activeAdmission) {
      this.feedbackController.set('info', AUTHORIZATIONS_MESSAGES.NO_ACTIVE_ADMISSION);
    }
  }

  private handleSearchError(err: unknown): void {
    if (getHttpErrorStatus(err) === HTTP_STATUS.NOT_FOUND) {
      this.resetResult();
      this.feedbackController.set('info', AUTHORIZATIONS_MESSAGES.NOT_FOUND);
      return;
    }
    this.feedbackController.set('error', getHttpErrorMessage(err, AUTHORIZATIONS_MESSAGES.LOAD_ERROR));
  }

  private async reloadCurrent(admissionNumber: string): Promise<void> {
    this.isSearching.set(true);
    try {
      const patient = await firstValueFrom(this.api.getAdmissionByNumber(admissionNumber));
      this.patient.set(patient);
      this.existingAuthorizations.set(patient.activeAdmission?.authorizations ?? []);
    } catch (err) {
      this.feedbackController.set('error', getHttpErrorMessage(err, AUTHORIZATIONS_MESSAGES.LOAD_ERROR));
    } finally {
      this.isSearching.set(false);
    }
  }

  private clearQueue(): void {
    this.queuedAuthForms.set([]);
    this.editingEntry.set(null);
  }

  private async resolveEpsContract(epsId: number | null): Promise<void> {
    if (epsId === null) {
      this.contractState.set({ status: 'idle', feeScheduleId: null });
      return;
    }

    this.contractState.set({ status: 'loading', feeScheduleId: null });
    try {
      const contracts = await firstValueFrom(this.catalogStore.resolveContracts(epsId));
      const feeScheduleId = resolveContractFeeSchedule(contracts);
      this.contractState.set({ status: feeScheduleId === null ? 'missing' : 'ready', feeScheduleId });
    } catch {
      this.contractState.set({ status: 'missing', feeScheduleId: null });
    }
  }

  private resetResult(): void {
    this.patient.set(null);
    this.existingAuthorizations.set([]);
    this.clearQueue();
  }

  private async loadCatalog(type: string): Promise<void> {
    await firstValueFrom(this.catalogStore.loadCatalog(type));
  }
}
