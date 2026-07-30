import { Injectable, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import {
  AdmissionsService,
  PatientLookupResult,
  CreateAdmissionData,
  AdmissionCensusRow,
} from '@features/admissions/services/admissions.service';

@Injectable({ providedIn: 'root' })
export class AdmissionStore {
  private readonly api = inject(AdmissionsService);

  private readonly lookupTrigger = signal<{ documentTypeId: number; document: string } | null>(null);

  private readonly lookupResource = rxResource({
    request: () => this.lookupTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.lookupPatient(request.documentTypeId, request.document);
    },
  });

  readonly patientFound = this.lookupResource.value.asReadonly();
  readonly isLookingUp = this.lookupResource.isLoading;
  readonly lookupError = this.lookupResource.error;

  private readonly createTrigger = signal<{ data: CreateAdmissionData } | null>(null);

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

  lookupPatient(documentTypeId: number, document: string): void {
    this.lookupTrigger.set({ documentTypeId, document });
  }

  createAdmission(data: CreateAdmissionData): void {
    this.createTrigger.set({ data });
  }

  reloadCensus(): void {
    this.censusResource.reload();
  }
}
