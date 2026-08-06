import { Component, inject, ViewChild, effect, signal, AfterViewInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdmissionStore } from '@features/admissions/store/admission.store';
import {
  ADMISSION_STATE_TRANSITIONS,
  CensusRowResponse,
} from '@features/admissions/models/admissions.model';
import { ToastService } from '@core/services/toast.service';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { PAGINATION } from '@shared/utils/pagination-constants';
import { createTableUtils } from '@shared/utils/table-utils';
import { getHttpErrorMessage } from '@shared/utils/http-error';
import { ADMISSION_MESSAGES, formatMessage } from '@shared/utils/messages';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import {
  CensusDischargeDialogComponent,
  DischargeDialogResult,
} from '@features/admissions/components/census-discharge-dialog/census-discharge-dialog.component';

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
            state: result.state,
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

  public onAdvanceState(row: CensusRowResponse): void {
    const nextState = this.nextStateOf(row);
    if (!nextState) return;
    this.updatingStateAdmissionNumber.set(row.admissionNumber);
    this.store.updateAdmissionState(row.admissionNumber, nextState);
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