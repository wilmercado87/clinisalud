import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, QueryList, ViewChildren } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TriageFormFacade } from '@features/triage/services/triage-form.facade';
import { AdmissionSearchComponent } from '@shared/components/admission-search/admission-search.component';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { PatientInfoCardComponent } from '@shared/components/patient-info-card/patient-info-card.component';
import { PatientRegistrationComponent } from '@shared/components/patient-registration/patient-registration.component';

@Component({
  selector: 'app-triage-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    AdmissionSearchComponent,
    CatalogSelectComponent,
    PatientInfoCardComponent,
    PatientRegistrationComponent,
  ],
  templateUrl: './triage-form.component.html',
  styleUrl: './triage-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TriageFormFacade],
})
export class TriageFormComponent {
  readonly facade = inject(TriageFormFacade);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  readonly resetToken = this.facade.resetToken;

  readonly patientForm = this.facade.patientForm;
  readonly triageForm = this.facade.triageForm;

  readonly mode = this.facade.mode;
  readonly feedback = this.facade.feedback;
  readonly patientFound = this.facade.patientFound;
  readonly diagnosticLabel = this.facade.diagnosticLabel;
  readonly attentionDate = this.facade.attentionDate;

  readonly searchEnabled = this.facade.searchEnabled;
  readonly patientErrors = this.facade.patientErrors;
  readonly triageErrors = this.facade.triageErrors;
  readonly canRegister = this.facade.canRegister;

  readonly isCreating = this.facade.isCreating;

  constructor() {
    effect(() => {
      this.facade.resetToken();
      this.catalogSelects?.forEach((select) => select.forceReset());
    });
  }

  onSearchPatient(): void {
    this.facade.onSearchPatient();
  }

  onDocumentBlur(): void {
    this.facade.onDocumentBlur();
  }

  openDiagnosticSearch(): void {
    void this.facade.openDiagnosticSearch();
  }

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }
}
