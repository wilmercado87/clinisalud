import { Injectable, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CreateTriageRequest, CreateTriageResponse } from '@features/triage/models/triage.model';
import { TriageService } from '@features/triage/services/triage.service';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { PatientLookupService } from '@shared/services/patient-lookup.service';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TriageStore {
  private readonly patientApi = inject(PatientLookupService);
  private readonly api = inject(TriageService);

  private readonly lookupTrigger = signal<{ documentTypeId: number; document: string } | null>(null);

  private readonly lookupResource = rxResource({
    request: () => this.lookupTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.patientApi.lookupPatient(request.documentTypeId, request.document);
    },
  });

  readonly patientFound = this.lookupResource.value.asReadonly();
  readonly isLookingUp = this.lookupResource.isLoading;
  readonly lookupError = this.lookupResource.error;

  private readonly createTrigger = signal<{ data: CreateTriageRequest } | null>(null);

  private readonly createResource = rxResource({
    request: () => this.createTrigger(),
    loader: ({ request }) => {
      if (!request) return of(null);
      return this.api.createTriage(request.data);
    },
  });

  readonly createResult = this.createResource.value.asReadonly();
  readonly isCreating = this.createResource.isLoading;
  readonly createError = this.createResource.error;

  lookupPatient(documentTypeId: number, document: string): void {
    this.lookupTrigger.set({ documentTypeId, document });
  }

  createTriage(data: CreateTriageRequest): void {
    this.createTrigger.set({ data });
  }

  clearCreateResult(): void {
    this.createTrigger.set(null);
  }
}
