import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AuthorizationEntryComponent,
  AuthorizationEntryUpdate,
} from '@features/admissions/components/authorization-entry/authorization-entry.component';
import {
  AuthorizationManagerFacade,
} from '@features/admissions/services/authorization-manager.facade';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';
import { AdmissionSearchComponent, AdmissionSearchMode } from '@shared/components/admission-search/admission-search.component';

@Component({
  selector: 'app-authorization-manager',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    AdmissionSearchComponent,
    AuthorizationEntryComponent,
  ],
  templateUrl: './authorization-manager.component.html',
  styleUrl: './authorization-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AuthorizationManagerFacade],
})
export class AuthorizationManagerComponent {
  readonly facade = inject(AuthorizationManagerFacade);

  private readonly admissionSearch = viewChild(AdmissionSearchComponent);

  readonly documentForm = this.facade.documentForm;
  readonly admissionNumberForm = this.facade.admissionNumberForm;

  readonly patient = this.facade.patient;
  readonly patientFullName = this.facade.patientFullName;
  readonly documentLabel = this.facade.documentLabel;
  readonly epsName = this.facade.epsName;
  readonly activeAdmission = this.facade.activeAdmission;
  readonly bedLabel = this.facade.bedLabel;

  readonly isSearching = this.facade.isSearching;
  readonly isSaving = this.facade.isSaving;
  readonly feedback = this.facade.feedback;

  readonly existingAuthRows = this.facade.existingAuthRows;
  readonly queuedAuthRows = this.facade.queuedAuthRows;
  readonly editingEntry = this.facade.editingEntry;
  readonly canSave = this.facade.canSave;

  onSearch(mode: AdmissionSearchMode): void {
    void this.facade.onSearch(mode);
  }

  onDocumentBlur(): void {
    this.facade.onDocumentBlur();
  }

  onSearchModeChanged(): void {
    this.facade.resetAll();
  }

  onSave(): void {
    void this.facade.saveAuthorizations();
  }

  onCancel(): void {
    this.admissionSearch()?.reset();
    this.facade.resetAll();
  }

  appendEntries(values: AuthorizationFormValue[]): void {
    this.facade.appendAuthEntries(values);
  }

  removeEntry(index: number): void {
    this.facade.removeAuthEntry(index);
  }

  editEntry(index: number): void {
    this.facade.startEditAuthEntry(index);
  }

  updateEntry(update: AuthorizationEntryUpdate): void {
    this.facade.updateAuthEntry(update.editIndex, update.entry);
  }

  clearEditing(): void {
    this.facade.clearEditingEntry();
  }
}
