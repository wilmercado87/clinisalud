import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, QueryList, ViewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import {
  AuthorizationEntryDialogComponent,
  AuthorizationEntryDialogData,
} from '@features/admissions/components/authorization-entry-dialog/authorization-entry-dialog.component';
import { AdmissionFormFacade } from '@features/admissions/services/admission-form.facade';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { AdmissionSearchComponent } from '@shared/components/admission-search/admission-search.component';

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
    MatTooltipModule,
    CatalogSelectComponent,
    AdmissionSearchComponent,
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
  readonly resetToken = this.facade.resetToken;

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

  appendAuthEntries(values: AuthorizationFormValue[]): void {
    this.facade.appendAuthEntries(values);
  }

  removeAuthEntry(index: number): void {
    this.facade.removeAuthEntry(index);
  }

  editAuthEntry(index: number): void {
    const fg = this.facade.authEntries()[index];
    if (!fg) return;

    const dialogRef = this.dialog.open(AuthorizationEntryDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data: {
        existingAuthorizations: this.facade.existingAuthorizations(),
        queuedAuthorizations: this.facade.authEntries().map((f) => f.getRawValue()),
        epsId: this.facade.admissionForm.controls.epsId.value ?? null,
        editIndex: index,
        initialEntry: fg.getRawValue(),
      } satisfies AuthorizationEntryDialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result?: { editIndex: number; entry: AuthorizationFormValue }) => {
        if (!result || result.editIndex === undefined) return;
        this.facade.updateAuthEntry(result.editIndex, result.entry);
      });
  }

  openAuthorizationsDialog(): void {
    const data: AuthorizationEntryDialogData = {
      existingAuthorizations: this.facade.existingAuthorizations(),
      queuedAuthorizations: this.facade.authEntries().map((fg) => fg.getRawValue()),
      epsId: this.facade.admissionForm.controls.epsId.value ?? null,
    };

    const dialogRef = this.dialog.open(AuthorizationEntryDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((values?: AuthorizationFormValue[]) => {
        if (!values || values.length === 0) return;
        this.appendAuthEntries(values);
      });
  }
}
