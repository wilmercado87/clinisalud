import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CensusRowResponse } from '@features/admissions/models/admissions.model';

export interface RevertStateDialogData {
  row: CensusRowResponse;
  previousState: string;
}

export interface RevertStateDialogResult {
  confirmed: boolean;
  admissionNumber: string;
}

@Component({
  selector: 'app-census-revert-state-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './census-revert-state-dialog.component.html',
  styleUrl: './census-revert-state-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CensusRevertStateDialogComponent {
  public readonly data = inject<RevertStateDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CensusRevertStateDialogComponent>);

  confirm(): void {
    this.dialogRef.close({
      confirmed: true,
      admissionNumber: this.data.row.admissionNumber,
    } satisfies RevertStateDialogResult);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
