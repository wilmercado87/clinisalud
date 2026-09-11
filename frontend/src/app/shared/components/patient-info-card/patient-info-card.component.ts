import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { PatientLookupResponse } from '@shared/models/patient-lookup.model';
import { findCatalogItemName } from '@shared/utils/catalog-mapper';

@Component({
  selector: 'app-patient-info-card',
  imports: [MatCardModule],
  templateUrl: './patient-info-card.component.html',
  styleUrl: './patient-info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientInfoCardComponent {
  private readonly catalogStore = inject(CatalogStore);

  readonly patient = input.required<PatientLookupResponse>();

  readonly patientFullName = computed(() => {
    const patient = this.patient();
    return `${patient.firstName} ${patient.lastName}`.trim();
  });

  readonly documentLabel = computed(() => {
    const patient = this.patient();
    const typeCode = patient.documentType?.code ?? '';
    return `${typeCode} ${patient.document}`.trim();
  });

  readonly epsName = computed(() => {
    this.catalogStore.versionOf('eps');
    return findCatalogItemName(this.catalogStore.getCatalog('eps'), this.patient().epsId ?? null);
  });

  constructor() {
    void firstValueFrom(this.catalogStore.loadCatalog('eps'));
  }
}
