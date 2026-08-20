import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';

import { ToastService } from '@core/services/toast.service';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import {
  CensusDischargeDialogComponent,
  DischargeDialogResult,
} from '@features/admissions/components/census-discharge-dialog/census-discharge-dialog.component';
import {
  CensusRevertStateDialogComponent,
  RevertStateDialogResult,
} from '@features/admissions/components/census-revert-state-dialog/census-revert-state-dialog.component';
import {
  ADMISSION_STATE_REVERSE_TRANSITIONS,
  ADMISSION_STATE_TRANSITIONS,
  CensusRowResponse,
} from '@features/admissions/models/admissions.model';
import { AdmissionStatePipe, admissionStateLabel } from '@features/admissions/pipes/admission-state.pipe';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { getHttpErrorMessage } from '@shared/utils/http-error';
import { ADMISSION_MESSAGES, formatMessage } from '@shared/utils/messages';
import { PAGINATION } from '@shared/utils/pagination-constants';
import { createTableUtils } from '@shared/utils/table-utils';

@Component({
  selector: 'app-census',
  imports: [
    CommonModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    AdmissionStatePipe,
  ],
  templateUrl: './census.component.html',
  styleUrl: './census.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CensusComponent implements AfterViewInit {
  private readonly store = inject(AdmissionStore);
  private readonly catalogStore = inject(CatalogStore);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly PAGE_SIZE_OPTIONS = PAGINATION.PAGE_SIZE_OPTIONS;
  public readonly displayedColumns: string[] = [
    'admissionNumber',
    'patient',
    'room',
    'eps',
    'admissionDate',
    'state',
    'actions',
  ];

  public readonly isLoadingCensus = this.store.isLoadingCensus;
  public readonly isDischarging = this.store.isDischarging;
  public readonly isUpdatingState = this.store.isUpdatingState;
  public dischargingAdmissionNumber = signal<string | null>(null);
  public updatingStateAdmissionNumber = signal<string | null>(null);

  public readonly censusTable = createTableUtils<CensusRowResponse>(this.filterPredicate);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.store.reloadCensus();
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      const census = this.store.census();
      if (census) this.censusTable.setData(census);
    });

    effect(() => {
      const result = this.store.dischargeResult();
      if (result && 'admissionNumber' in result) {
        this.toast.success(
          formatMessage(ADMISSION_MESSAGES.ADMISSION_DISCHARGED, {
            admissionNumber: result.admissionNumber,
          }),
        );
        this.dischargingAdmissionNumber.set(null);
        this.catalogStore.invalidateCatalog('beds');
        this.store.reloadCensus();
        this.store.clearDischargeResult();
      }
    });

    effect(() => {
      const err = this.store.dischargeError();
      if (err) {
        this.toast.error(getHttpErrorMessage(err, ADMISSION_MESSAGES.ADMISSION_DISCHARGE_ERROR));
        this.dischargingAdmissionNumber.set(null);
      }
    });

    effect(() => {
      const result = this.store.updateStateResult();
      if (result && 'admissionNumber' in result) {
        this.toast.success(
          formatMessage(ADMISSION_MESSAGES.ADMISSION_STATE_CHANGED, {
            admissionNumber: result.admissionNumber,
            state: admissionStateLabel(result.state),
          }),
        );
        this.updatingStateAdmissionNumber.set(null);
        this.store.reloadCensus();
        this.store.clearUpdateStateResult();
      }
    });

    effect(() => {
      const err = this.store.updateStateError();
      if (err) {
        this.toast.error(getHttpErrorMessage(err, ADMISSION_MESSAGES.ADMISSION_STATE_CHANGE_ERROR));
        this.updatingStateAdmissionNumber.set(null);
      }
    });

    effect(() => {
      if (this.store.censusError()) {
        this.toast.error(ADMISSION_MESSAGES.CENSUS_LOAD_ERROR);
      }
    });
  }

  ngAfterViewInit(): void {
    this.censusTable.connectPaginatorSort(this.paginator, this.sort);
  }

  public onDischarge(row: CensusRowResponse): void {
    this.dialog
      .open(CensusDischargeDialogComponent, {
        width: '440px',
        disableClose: true,
        data: { row },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: DischargeDialogResult | undefined) => {
        if (!result?.confirmed) return;
        this.dischargingAdmissionNumber.set(row.admissionNumber);
        this.store.dischargeAdmission(result.admissionNumber);
      });
  }

  public nextStateOf(row: CensusRowResponse): string | null {
    return ADMISSION_STATE_TRANSITIONS[row.state as keyof typeof ADMISSION_STATE_TRANSITIONS] ?? null;
  }

  public previousStateOf(row: CensusRowResponse): string | null {
    return ADMISSION_STATE_REVERSE_TRANSITIONS[row.state as keyof typeof ADMISSION_STATE_REVERSE_TRANSITIONS] ?? null;
  }

  public onAdvanceState(row: CensusRowResponse): void {
    const nextState = this.nextStateOf(row);
    if (!nextState) return;
    this.updatingStateAdmissionNumber.set(row.admissionNumber);
    this.store.updateAdmissionState(row.admissionNumber, nextState);
  }

  public onRevertState(row: CensusRowResponse): void {
    const previousState = this.previousStateOf(row);
    if (!previousState) return;

    this.dialog
      .open(CensusRevertStateDialogComponent, {
        width: '440px',
        disableClose: true,
        data: { row, previousState: admissionStateLabel(previousState) },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: RevertStateDialogResult | undefined) => {
        if (!result?.confirmed) return;
        this.updatingStateAdmissionNumber.set(row.admissionNumber);
        this.store.updateAdmissionState(row.admissionNumber, previousState);
      });
  }

  private filterPredicate(data: CensusRowResponse, filter: string): boolean {
    const searchTerms = [
      data.admissionNumber,
      data.patient?.firstName,
      data.patient?.lastName,
      data.patient?.document,
      data.room?.bedCode,
      data.eps?.epsName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchTerms.includes(filter.trim().toLowerCase());
  }
}
