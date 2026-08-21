import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  AuthorizationEntryComponent,
  AuthorizationEntryUpdate,
} from '@features/admissions/components/authorization-entry/authorization-entry.component';
import { AdmissionAuthorization } from '@features/admissions/models/admissions.model';
import { AuthorizationFormValue } from '@features/admissions/utils/authorization/authorization-form.types';

export interface AuthorizationEntryDialogData {
  existingAuthorizations: AdmissionAuthorization[];
  queuedAuthorizations: AuthorizationFormValue[];
  contractFeeScheduleId: number | null;
  editIndex?: number;
  initialEntry?: AuthorizationFormValue;
}

export type AuthorizationEntryDialogResult = AuthorizationFormValue[] | AuthorizationEntryUpdate;

@Component({
  selector: 'app-authorization-entry-dialog',
  imports: [CommonModule, MatDialogModule, AuthorizationEntryComponent],
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>
    <mat-dialog-content class="authorization-entry-dialog__content">
      <app-authorization-entry
        [contractFeeScheduleId]="data().contractFeeScheduleId"
        [existingAuthorizations]="data().existingAuthorizations"
        [queuedAuthorizations]="data().queuedAuthorizations"
        [editIndex]="data().editIndex"
        [initialEntry]="data().initialEntry"
        (entriesApplied)="closeWith($event)"
        (entryUpdated)="closeWith($event)"
        (cancelled)="close()"
      />
    </mat-dialog-content>
  `,
  styleUrl: './authorization-entry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationEntryDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AuthorizationEntryDialogComponent>);

  readonly data = signal<AuthorizationEntryDialogData>(inject<AuthorizationEntryDialogData>(MAT_DIALOG_DATA));

  readonly title = computed(() =>
    this.data().editIndex !== undefined ? 'Editar Autorización' : 'Agregar Autorizaciones',
  );

  close(): void {
    this.dialogRef.close();
  }

  closeWith(result: AuthorizationEntryDialogResult): void {
    this.dialogRef.close(result);
  }
}
