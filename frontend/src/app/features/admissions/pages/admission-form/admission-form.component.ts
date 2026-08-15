import {
  Component,
  effect,
  inject,
  ChangeDetectionStrategy,
  DestroyRef,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { AuthEntryDialogComponent } from '@features/admissions/components/auth-entry-dialog/auth-entry-dialog.component';
import { AdmissionFormFacade } from '@features/admissions/services/admission-form.facade';
import { AuthFormValue } from '@features/admissions/utils/admission-form.types';

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
  providers: [AdmissionFormFacade],
})
export class AdmissionFormComponent {
  readonly facade = inject(AdmissionFormFacade);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  readonly today = this.facade.today;

  readonly patientForm = this.facade.patientForm;
  readonly companionForm = this.facade.companionForm;
  readonly admissionForm = this.facade.admissionForm;

  readonly mode = this.facade.mode;
  readonly feedback = this.facade.feedback;
  readonly authEntries = this.facade.authEntries;
  readonly existingAuthorizations = this.facade.existingAuthorizations;
  readonly companionActive = this.facade.companionActive;

  readonly searchEnabled = this.facade.searchEnabled;
  readonly dataEnabled = this.facade.dataEnabled;
  readonly activeAdmission = this.facade.activeAdmission;
  readonly isUpdatingMode = this.facade.isUpdatingMode;
  readonly occupiedBedLabel = this.facade.occupiedBedLabel;
  readonly patientErrors = this.facade.patientErrors;
  readonly companionErrors = this.facade.companionErrors;
  readonly admissionErrors = this.facade.admissionErrors;
  readonly existingAuthRows = this.facade.existingAuthRows;
  readonly newAuthRows = this.facade.newAuthRows;
  readonly hasPendingChanges = this.facade.hasPendingChanges;
  readonly canSubmit = this.facade.canSubmit;

  readonly isCreating = this.facade.isCreating;
  readonly createResult = this.facade.createResult;
  readonly createError = this.facade.createError;
  readonly isUpdating = this.facade.isUpdating;
  readonly updateResult = this.facade.updateResult;
  readonly updateError = this.facade.updateError;

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

  onCancel(): void {
    this.facade.onCancel();
  }

  onSubmit(): void {
    this.facade.onSubmit();
  }

  appendAuthEntries(values: AuthFormValue[]): void {
    this.facade.appendAuthEntries(values);
  }

  removeAuthEntry(index: number): void {
    this.facade.removeAuthEntry(index);
  }

  openAuthorizationsDialog(): void {
    const dialogRef = this.dialog.open(AuthEntryDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values?: AuthFormValue[]) => {
        if (!values || values.length === 0) return;
        this.appendAuthEntries(values);
      });
  }
}
