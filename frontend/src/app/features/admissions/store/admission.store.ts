import { Injectable, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { AdmissionsService } from '@features/admissions/services/admissions.service';
import { CreateAdmissionRequest } from '@features/admissions/models/admissions.model';

@Injectable({ providedIn: 'root' })
export class AdmissionStore {
  private readonly api = inject(AdmissionsService);

  private readonly lookupTrigger = signal<{ documentTypeId: number; document: string } | null>(null);

  private readonly lookupResource = rxResource({
    request: () => this.lookupTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.lookupPatient(request);
    },
  });

  readonly patientFound = this.lookupResource.value.asReadonly();
  readonly isLookingUp = this.lookupResource.isLoading;
  readonly lookupError = this.lookupResource.error;

  private readonly createTrigger = signal<{ data: CreateAdmissionRequest } | null>(null);

  private readonly createResource = rxResource({
    request: () => this.createTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.createAdmission(request.data);
    },
  });

  readonly createResult = this.createResource.value.asReadonly();
  readonly isCreating = this.createResource.isLoading;
  readonly createError = this.createResource.error;

  private readonly censusResource = rxResource({
    loader: () => this.api.getCensus(),
  });

  readonly census = this.censusResource.value.asReadonly();
  readonly isLoadingCensus = this.censusResource.isLoading;
  readonly censusError = this.censusResource.error;

  private readonly dischargeTrigger = signal<string | null>(null);

  private readonly dischargeResource = rxResource({
    request: () => this.dischargeTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.dischargeAdmission(request);
    },
  });

  readonly dischargeResult = this.dischargeResource.value.asReadonly();
  readonly isDischarging = this.dischargeResource.isLoading;
  readonly dischargeError = this.dischargeResource.error;

  private readonly stateTrigger = signal<{ admissionNumber: string; state: string } | null>(null);

  private readonly stateResource = rxResource({
    request: () => this.stateTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.updateAdmissionState(request.admissionNumber, request.state);
    },
  });

  readonly updateStateResult = this.stateResource.value.asReadonly();
  readonly isUpdatingState = this.stateResource.isLoading;
  readonly updateStateError = this.stateResource.error;

  lookupPatient(documentTypeId: number, document: string): void {
    this.lookupTrigger.set({ documentTypeId, document });
  }

  createAdmission(data: CreateAdmissionRequest): void {
    this.createTrigger.set({ data });
  }

  clearCreateResult(): void {
    this.createTrigger.set(null);
  }

  reloadCensus(): void {
    this.censusResource.reload();
  }

  dischargeAdmission(admissionNumber: string): void {
    this.dischargeTrigger.set(admissionNumber);
  }

  clearDischargeResult(): void {
    this.dischargeTrigger.set(null);
  }

  updateAdmissionState(admissionNumber: string, state: string): void {
    this.stateTrigger.set({ admissionNumber, state });
  }

  clearUpdateStateResult(): void {
    this.stateTrigger.set(null);
  }
}
