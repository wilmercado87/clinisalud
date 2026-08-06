import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CensusRowResponse } from '@features/admissions/models/admissions.model';

export interface DischargeDialogData {
  row: CensusRowResponse;
}

export interface DischargeDialogResult {
  confirmed: boolean;
  admissionNumber: string;
}

@Component({
  selector: 'app-census-discharge-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './census-discharge-dialog.component.html',
  styleUrl: './census-discharge-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CensusDischargeDialogComponent {
  public readonly row = inject<DischargeDialogData>(MAT_DIALOG_DATA).row;
  private readonly dialogRef = inject(MatDialogRef<CensusDischargeDialogComponent>);

  confirm(): void {
    this.dialogRef.close({
      confirmed: true,
      admissionNumber: this.row.admissionNumber,
    } satisfies DischargeDialogResult);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}