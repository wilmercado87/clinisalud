import {
  Component,
  computed,
  effect,
  inject,
  ChangeDetectionStrategy,
  Injector,
  Signal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { CupsSearchItem } from '@core/models/catalog.model';
import {
  CupsSearchDialogComponent,
  CupsSearchDialogData,
} from '@features/admissions/components/cups-search-dialog/cups-search-dialog.component';
import { AuthFormGroup, AuthFormValue } from '@features/admissions/utils/admission-form.types';
import { createAuthEntryForm } from '@features/admissions/utils/admission-form.factory';
import {
  applyAuthCupsSelection,
  AUTH_ERROR_RULES,
  clearAuthCupsSelection,
} from '@features/admissions/utils/admission-form-validator';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { findCatalogItemName } from '@shared/utils/catalog-mapper';
import { AUTH_MESSAGES } from '@shared/utils/messages';

interface EntryError {
  authTypeId?: string;
  authNumber?: string;
  feeScheduleId?: string;
  mapiissCode?: string;
  quantity?: string;
}

type ErrorMap = Map<string, number>;

@Component({
  selector: 'app-auth-entry-dialog',
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
  templateUrl: './auth-entry-dialog.component.html',
  styleUrl: './auth-entry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthEntryDialogComponent {
  private readonly catalogStore = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AuthEntryDialogComponent>);
  private readonly injector = inject(Injector);

  readonly entries = signal<AuthFormGroup[]>([]);
  private readonly entryValues = new Map<AuthFormGroup, Signal<Partial<AuthFormValue>>>();
  private readonly lastFeeSchedule = new Map<AuthFormGroup, number | null>();

  readonly errors = computed(() => this.computeEntryErrors());

  readonly canApply = computed(() => {
    const list = this.entries();
    if (list.length === 0) return false;
    const hasErrors = this.errors().some((e) => Object.keys(e).length > 0);
    if (hasErrors) return false;
    return list.every((fg) => fg.valid);
  });

  constructor() {
    this.addEntry();
    this.registerEffects();
  }

  addEntry(): void {
    const fg = createAuthEntryForm();
    this.entryValues.set(
      fg,
      toSignal(fg.valueChanges, { initialValue: fg.getRawValue(), injector: this.injector }),
    );
    this.entries.update((list) => [...list, fg]);
  }

  removeEntry(index: number): void {
    const fg = this.entries()[index];
    if (!fg) return;
    this.entries.update((list) => list.filter((_, i) => i !== index));
    this.entryValues.delete(fg);
    this.lastFeeSchedule.delete(fg);
  }

  private registerEffects(): void {
    effect(() => {
      for (const fg of this.entries()) {
        this.entryValues.get(fg)?.();
        const feeScheduleId = fg.controls.feeScheduleId.value;
        const previous = this.lastFeeSchedule.get(fg);
        this.lastFeeSchedule.set(fg, feeScheduleId);
        if (previous !== undefined && previous !== null && previous !== feeScheduleId) {
          clearAuthCupsSelection(fg);
        }
      }
    });
  }

  private computeEntryErrors(): EntryError[] {
    const entries = this.entries();
    const authNumberIndex = this.buildAuthNumberIndex(entries);
    const compositeKeyIndex = this.buildCompositeKeyIndex(entries);

    return entries.map((fg, index) => {
      this.entryValues.get(fg)?.();
      return this.mergeErrors(
        this.getBaseErrors(fg),
        this.checkDuplicateAuthNumber(fg, index, authNumberIndex),
        this.checkDuplicateCompositeKey(fg, index, compositeKeyIndex),
      );
    });
  }

  private buildAuthNumberIndex(entries: AuthFormGroup[]): ErrorMap {
    const map = new Map<string, number>();
    entries.forEach((fg, index) => {
      const normalized = this.normalizeAuthNumber(fg.controls.authNumber.value);
      if (normalized) map.set(normalized, index);
    });
    return map;
  }

  private buildCompositeKeyIndex(entries: AuthFormGroup[]): ErrorMap {
    const map = new Map<string, number>();
    entries.forEach((fg, index) => {
      const key = this.buildCompositeKey(fg);
      if (key) map.set(key, index);
    });
    return map;
  }

  private normalizeAuthNumber(value: string | null): string | null {
    return value?.trim().toUpperCase() ?? null;
  }

  private buildCompositeKey(fg: AuthFormGroup): string | null {
    const authTypeId = fg.controls.authTypeId.value;
    const mapiissCode = fg.controls.mapiissCode.value;
    const feeScheduleId = fg.controls.feeScheduleId.value;
    if (authTypeId === null || !mapiissCode || feeScheduleId === null) return null;
    return `${authTypeId}|${mapiissCode}|${feeScheduleId}`;
  }

  private getBaseErrors(fg: AuthFormGroup): EntryError {
    const baseErrors = extractFieldErrors(fg, AUTH_ERROR_RULES);
    const result: EntryError = {};
    for (const [key, value] of Object.entries(baseErrors)) {
      if (value !== null) {
        (result as Record<string, string>)[key] = value;
      }
    }
    return result;
  }

  private checkDuplicateAuthNumber(
    fg: AuthFormGroup,
    index: number,
    indexMap: ErrorMap,
  ): EntryError {
    const normalized = this.normalizeAuthNumber(fg.controls.authNumber.value);
    if (!normalized) return {};
    if (indexMap.get(normalized) !== index) {
      return { authNumber: AUTH_MESSAGES.DUPLICATE_AUTH_NUMBER };
    }
    return {};
  }

  private checkDuplicateCompositeKey(
    fg: AuthFormGroup,
    index: number,
    indexMap: ErrorMap,
  ): EntryError {
    const key = this.buildCompositeKey(fg);
    if (!key) return {};
    if (indexMap.get(key) !== index) {
      return { mapiissCode: AUTH_MESSAGES.DUPLICATE_COMPOSITE_KEY };
    }
    return {};
  }

  private mergeErrors(...errorObjects: EntryError[]): EntryError {
    return errorObjects.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  openCupsSearch(index: number): void {
    const fg = this.entries()[index];
    if (!fg) return;

    const feeScheduleId = fg.controls.feeScheduleId.value;
    if (feeScheduleId === null) return;

    const cupsDialogRef = this.dialog.open(CupsSearchDialogComponent, {
      width: '560px',
      maxWidth: '90vw',
      data: {
        feeScheduleId,
        feeScheduleName: this.feeScheduleName(feeScheduleId),
      } satisfies CupsSearchDialogData,
    });

    void firstValueFrom(cupsDialogRef.afterClosed()).then((cups?: CupsSearchItem) => {
      if (!cups) return;
      applyAuthCupsSelection(fg, cups);
    });
  }

  private feeScheduleName(feeScheduleId: number): string {
    return (
      findCatalogItemName(this.catalogStore.getCatalog('fee-schedules'), feeScheduleId) ||
      `#${feeScheduleId}`
    );
  }

  apply(): void {
    if (!this.canApply()) return;
    this.dialogRef.close(this.entries().map((fg) => fg.getRawValue()));
  }

  cancel(): void {
    this.dialogRef.close();
  }
}