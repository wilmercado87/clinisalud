import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, Injector, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CupsSearchItem } from '@core/models/catalog.model';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import {
  CupsSearchDialogComponent,
  CupsSearchDialogData,
} from '@features/admissions/components/cups-search-dialog/cups-search-dialog.component';
import { AdmissionAuthorization } from '@features/admissions/models/admissions.model';
import { createAuthorizationForm } from '@features/admissions/utils/authorization/authorization-form.factory';
import {
  AuthorizationEntryError,
  AuthorizationFormGroup,
  AuthorizationFormValue,
} from '@features/admissions/utils/authorization/authorization-form.types';
import {
  applyAuthorizationCupsSelection,
  clearAuthorizationCupsSelection,
  computeAuthorizationEntryErrors,
} from '@features/admissions/utils/authorization/authorization-form.validator';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { findCatalogItemName } from '@shared/utils/catalog-mapper';
import { firstValueFrom } from 'rxjs';

export interface AuthorizationEntryDialogData {
  existingAuthorizations: AdmissionAuthorization[];
  queuedAuthorizations: AuthorizationFormValue[];
}

@Component({
  selector: 'app-authorization-entry-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CatalogSelectComponent,
  ],
  templateUrl: './authorization-entry-dialog.component.html',
  styleUrl: './authorization-entry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationEntryDialogComponent {
  private readonly catalogStore = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AuthorizationEntryDialogComponent>);
  private readonly injector = inject(Injector);

  readonly dialogData = signal<AuthorizationEntryDialogData>(inject<AuthorizationEntryDialogData>(MAT_DIALOG_DATA));

  readonly entries = signal<AuthorizationFormGroup[]>([]);
  private readonly entryValues = new Map<AuthorizationFormGroup, Signal<Partial<AuthorizationFormValue>>>();
  private readonly lastFeeSchedule = new Map<AuthorizationFormGroup, number | null>();
  private readonly lastAuthType = new Map<AuthorizationFormGroup, number | null>();

  readonly errors = computed(() => {
    const entries = this.entries();
    const { existingAuthorizations, queuedAuthorizations } = this.dialogData();
    for (const fg of entries) this.entryValues.get(fg)?.();
    return computeAuthorizationEntryErrors(entries, existingAuthorizations, queuedAuthorizations);
  });

  readonly canApply = computed(() => {
    const list = this.entries();
    if (list.length === 0) return false;
    const hasErrors = this.errors().some((e: AuthorizationEntryError) => Object.keys(e).length > 0);
    if (hasErrors) return false;
    return list.every((fg) => fg.valid);
  });

  constructor() {
    this.addEntry();
    this.registerEffects();
  }

  addEntry(): void {
    const fg = createAuthorizationForm();
    this.entryValues.set(fg, toSignal(fg.valueChanges, { initialValue: fg.getRawValue(), injector: this.injector }));
    this.entries.update((list) => [...list, fg]);
  }

  removeEntry(index: number): void {
    const fg = this.entries()[index];
    if (!fg) return;
    this.entries.update((list) => list.filter((_, i) => i !== index));
    this.entryValues.delete(fg);
    this.lastFeeSchedule.delete(fg);
    this.lastAuthType.delete(fg);
  }

  private registerEffects(): void {
    effect(() => {
      for (const fg of this.entries()) {
        this.entryValues.get(fg)?.();
        const feeScheduleId = fg.controls.feeScheduleId.value;
        const previousFeeSchedule = this.lastFeeSchedule.get(fg);
        this.lastFeeSchedule.set(fg, feeScheduleId);
        if (
          previousFeeSchedule !== undefined &&
          previousFeeSchedule !== null &&
          previousFeeSchedule !== feeScheduleId
        ) {
          clearAuthorizationCupsSelection(fg);
        }

        const authTypeId = fg.controls.authTypeId.value;
        const previousAuthType = this.lastAuthType.get(fg);
        this.lastAuthType.set(fg, authTypeId);
        if (previousAuthType !== undefined && previousAuthType !== null && previousAuthType !== authTypeId) {
          clearAuthorizationCupsSelection(fg);
        }
      }
    });
  }

  async openCupsSearch(index: number): Promise<void> {
    const fg = this.entries()[index];
    if (!fg) return;

    const feeScheduleId = fg.controls.feeScheduleId.value;
    const authTypeId = fg.controls.authTypeId.value;
    if (feeScheduleId === null || authTypeId === null) return;

    let attentionLevelId = this.attentionLevelOf(authTypeId);
    if (attentionLevelId === undefined) {
      await firstValueFrom(this.catalogStore.reloadCatalog('authorization-types'));
      attentionLevelId = this.attentionLevelOf(authTypeId);
    }

    const cupsDialogRef = this.dialog.open(CupsSearchDialogComponent, {
      width: '560px',
      maxWidth: '90vw',
      data: {
        feeScheduleId,
        feeScheduleName: this.feeScheduleName(feeScheduleId),
        attentionLevelId,
      } satisfies CupsSearchDialogData,
    });

    void firstValueFrom(cupsDialogRef.afterClosed()).then((cups?: CupsSearchItem) => {
      if (!cups) return;
      applyAuthorizationCupsSelection(fg, cups);
    });
  }

  private attentionLevelOf(authTypeId: number): number | undefined {
    const item = this.catalogStore
      .getCatalog('authorization-types')
      .find((catalogItem) => 'id' in catalogItem && catalogItem.id === authTypeId);
    return item && 'attentionLevelId' in item ? item.attentionLevelId : undefined;
  }

  private feeScheduleName(feeScheduleId: number): string {
    return findCatalogItemName(this.catalogStore.getCatalog('fee-schedules'), feeScheduleId) || `#${feeScheduleId}`;
  }

  apply(): void {
    if (!this.canApply()) return;
    this.dialogRef.close(this.entries().map((fg) => fg.getRawValue()));
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
