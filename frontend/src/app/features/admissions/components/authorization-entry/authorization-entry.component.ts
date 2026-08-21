import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  input,
  output,
  QueryList,
  Signal,
  signal,
  untracked,
  ViewChildren,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { ContratoResponse, CatalogSourceItem, CupsSearchItem } from '@core/models/catalog.model';
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
  computeAuthorizationFieldErrors,
  evaluateAuthorizationEntryRules,
  formatAuthorizationViolationMessage,
} from '@features/admissions/utils/authorization/authorization-form.validator';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { findCatalogItemName } from '@shared/utils/catalog-mapper';
import { firstValueFrom } from 'rxjs';

export interface AuthorizationEntryUpdate {
  editIndex: number;
  entry: AuthorizationFormValue;
}

@Component({
  selector: 'app-authorization-entry',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CatalogSelectComponent,
  ],
  templateUrl: './authorization-entry.component.html',
  styleUrl: './authorization-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthorizationEntryComponent {
  private readonly catalogStore = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly injector = inject(Injector);

  readonly epsId = input.required<number | null>();
  readonly existingAuthorizations = input<AdmissionAuthorization[]>([]);
  readonly queuedAuthorizations = input<AuthorizationFormValue[]>([]);
  readonly editIndex = input<number>();
  readonly initialEntry = input<AuthorizationFormValue>();
  readonly applyLabel = input('Aplicar');
  readonly cancelLabel = input('Cancelar');

  readonly entriesApplied = output<AuthorizationFormValue[]>();
  readonly entryUpdated = output<AuthorizationEntryUpdate>();
  readonly cancelled = output<void>();

  readonly entries = signal<AuthorizationFormGroup[]>([]);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  private readonly editTarget = computed(() => {
    const index = this.editIndex();
    const initialEntry = this.initialEntry();
    if (index == null || !initialEntry) return null;
    return { index, initialEntry };
  });
  private readonly entryValues = new Map<AuthorizationFormGroup, Signal<Partial<AuthorizationFormValue>>>();
  private readonly lastAuthType = new Map<AuthorizationFormGroup, number | null>();

  readonly contractFeeScheduleId = computed(() => {
    const epsId = this.epsId();
    if (epsId === null || epsId === undefined) return null;
    const contracts = this.catalogStore.contracts() ?? [];
    if (contracts.length === 0) return null;
    return this.resolveContractFeeSchedule(contracts);
  });

  private readonly feeScheduleCatalog = signal<CatalogSourceItem[]>([]);

  readonly feeScheduleName = computed(() => this.catalogFeeScheduleName(this.contractFeeScheduleId()));

  readonly tariffNoteMessage = computed(() => {
    const name = this.feeScheduleName();
    return name
      ? `El tarifario ${name} se identifica automáticamente según el contrato de la EPS.`
      : 'El tarifario se identifica automáticamente según el contrato de la EPS.';
  });

  readonly errors = computed(() => {
    const entries = this.entries();
    for (const fg of entries) this.entryValues.get(fg)?.();
    return computeAuthorizationFieldErrors(entries);
  });

  readonly ruleViolations = computed(() => {
    const entries = this.entries();
    for (const fg of entries) this.entryValues.get(fg)?.();
    return evaluateAuthorizationEntryRules(entries, this.existingAuthorizations(), this.queuedAuthorizations());
  });

  readonly affectedRows = computed(() => {
    if (!this.applyAttempted()) return new Set<number>();
    return new Set(this.ruleViolations().map((violation) => violation.row));
  });

  private readonly applyAttempted = signal(false);

  readonly statusMessage = computed(() => {
    if (this.tariffBlockedMessage()) return this.tariffBlockedMessage();
    if (!this.applyAttempted()) return null;
    const violation = this.ruleViolations()[0];
    if (!violation) return null;
    return formatAuthorizationViolationMessage(violation);
  });

  readonly canApply = computed(() => {
    if (this.contractFeeScheduleId() === null) return false;
    const list = this.entries();
    if (list.length === 0) return false;
    const hasErrors = this.errors().some((e: AuthorizationEntryError) => Object.keys(e).length > 0);
    if (hasErrors) return false;
    return list.every((fg) => fg.valid);
  });

  private readonly tariffBlockedMessage = computed(() => {
    if (this.contractFeeScheduleId() !== null) return null;
    const epsId = this.epsId();
    return epsId === null || epsId === undefined
      ? 'Seleccione la EPS para identificar el tarifario antes de registrar autorizaciones'
      : 'La EPS seleccionada no tiene un contrato con tarifario asociado';
  });

  constructor() {
    this.loadFeeScheduleCatalog();
    this.registerEffects();
  }

  addEntry(): void {
    const fg = createAuthorizationForm();
    this.trackEntry(fg);
    this.entries.update((list) => [...list, fg]);
  }

  removeEntry(index: number): void {
    const fg = this.entries()[index];
    if (!fg) return;
    this.entries.update((list) => list.filter((_, i) => i !== index));
    this.entryValues.delete(fg);
    this.lastAuthType.delete(fg);
  }

  authTypeErrorMessage(index: number): string | null {
    const fg = this.entries()[index];
    if (!fg) return null;
    const control = fg.controls.authTypeId;
    if (!control.touched && !control.dirty) return null;
    return this.errors()[index]['authTypeId'] ?? null;
  }

  apply(): void {
    if (!this.canApply()) return;
    if (this.ruleViolations().length > 0) {
      this.applyAttempted.set(true);
      return;
    }
    const target = this.editTarget();
    if (target) {
      this.entryUpdated.emit({ editIndex: target.index, entry: this.entries()[0].getRawValue() });
    } else {
      this.entriesApplied.emit(this.entries().map((fg) => fg.getRawValue()));
    }
    this.resetEntries();
  }

  cancel(): void {
    this.cancelled.emit();
    this.resetEntries();
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
        feeScheduleName: this.catalogFeeScheduleName(feeScheduleId),
        attentionLevelId,
      } satisfies CupsSearchDialogData,
    });

    void firstValueFrom(cupsDialogRef.afterClosed()).then((cups?: CupsSearchItem) => {
      if (!cups) return;
      applyAuthorizationCupsSelection(fg, cups);
    });
  }

  private registerEffects(): void {
    effect(() => {
      const feeScheduleId = this.contractFeeScheduleId();
      for (const fg of this.entries()) {
        this.syncContractFeeSchedule(fg, feeScheduleId);
      }
    });

    effect(() => {
      for (const fg of this.entries()) {
        this.entryValues.get(fg)?.();
        const authTypeId = fg.controls.authTypeId.value;
        const previousAuthType = this.lastAuthType.get(fg);
        this.lastAuthType.set(fg, authTypeId);
        if (previousAuthType !== undefined && previousAuthType !== null && previousAuthType !== authTypeId) {
          clearAuthorizationCupsSelection(fg);
        }
      }
    });

    effect(() => {
      const epsId = this.epsId();
      if (epsId !== null && epsId !== undefined) {
        this.catalogStore.loadContracts(epsId);
      }
    });

    effect(() => {
      const target = this.editTarget();
      untracked(() => this.initializeEntries(target));
    });
  }

  private initializeEntries(target: { index: number; initialEntry: AuthorizationFormValue } | null): void {
    if (target) {
      const fg = createAuthorizationForm();
      fg.patchValue(target.initialEntry);
      this.trackEntry(fg);
      this.entries.set([fg]);
      return;
    }
    this.resetEntries();
  }

  private resetEntries(): void {
    this.entries.set([]);
    this.entryValues.clear();
    this.lastAuthType.clear();
    this.applyAttempted.set(false);
    this.addEntry();
    this.catalogSelects?.forEach((select) => select.forceReset());
  }

  private trackEntry(formGroup: AuthorizationFormGroup): void {
    this.entryValues.set(
      formGroup,
      toSignal(formGroup.valueChanges, { initialValue: formGroup.getRawValue(), injector: this.injector }),
    );
  }

  private loadFeeScheduleCatalog(): void {
    const cached = this.catalogStore.getCatalog('fee-schedules');
    if (cached.length > 0) this.feeScheduleCatalog.set(cached);
    void firstValueFrom(this.catalogStore.loadCatalog('fee-schedules')).then((items) => {
      this.feeScheduleCatalog.set(items);
    });
  }

  private syncContractFeeSchedule(formGroup: AuthorizationFormGroup, feeScheduleId: number | null): void {
    if (!formGroup.controls.feeScheduleId.disabled || formGroup.controls.feeScheduleId.value !== feeScheduleId) {
      formGroup.controls.feeScheduleId.disable();
      formGroup.controls.feeScheduleId.setValue(feeScheduleId);
    }
  }

  private resolveContractFeeSchedule(contracts: ContratoResponse[]): number | null {
    const sorted = [...contracts].sort((a, b) => this.contractEndKey(b.endDate) - this.contractEndKey(a.endDate));
    return sorted[0]?.feeScheduleId ?? null;
  }

  private contractEndKey(endDate: string): number {
    const [day, month, year] = endDate.split('/');
    return Number(`${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`);
  }

  private attentionLevelOf(authTypeId: number): number | undefined {
    const item = this.catalogStore
      .getCatalog('authorization-types')
      .find((catalogItem) => 'id' in catalogItem && catalogItem.id === authTypeId);
    return item && 'attentionLevelId' in item ? item.attentionLevelId : undefined;
  }

  private catalogFeeScheduleName(feeScheduleId: number | null | undefined): string {
    if (feeScheduleId === null || feeScheduleId === undefined) return '';
    return (findCatalogItemName(this.feeScheduleCatalog(), feeScheduleId) || `#${feeScheduleId}`).replaceAll('_', ' ');
  }
}
