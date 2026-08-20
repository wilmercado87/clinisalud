import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CupsPageResponse, CupsSearchItem } from '@core/models/catalog.model';
import { CatalogService } from '@core/services/catalog.service';
import { getHttpErrorMessage } from '@shared/utils/http-error';
import { ADMISSION_MESSAGES } from '@shared/utils/messages';
import { debounceTime, map, of } from 'rxjs';

export interface CupsSearchDialogData {
  feeScheduleId: number;
  feeScheduleName: string;
  attentionLevelId?: number;
}

interface CupsSearchParams {
  term: string;
  feeScheduleId: number;
  attentionLevelId?: number;
  page: number;
}

const CUPS_MIN_CHARS = 3;
const CUPS_PAGE_SIZE = 20;
const EMPTY_PAGE: CupsPageResponse = { items: [], total: 0 };

@Component({
  selector: 'app-cups-search-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cups-search-dialog.component.html',
  styleUrl: './cups-search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CupsSearchDialogComponent {
  private readonly catalogApi = inject(CatalogService);
  private readonly dialogRef = inject(MatDialogRef<CupsSearchDialogComponent>);
  public readonly data = inject<CupsSearchDialogData>(MAT_DIALOG_DATA);

  readonly termControl = new FormControl('', { nonNullable: true });

  private readonly page = signal(1);
  readonly items = signal<CupsSearchItem[]>([]);
  readonly total = signal(0);

  readonly minCharsHint = CUPS_MIN_CHARS;

  private readonly debouncedTerm = toSignal(this.termControl.valueChanges.pipe(debounceTime(300)), {
    initialValue: '',
  });

  readonly termLength = computed(() => this.debouncedTerm().trim().length);
  readonly searchable = computed(() => this.termLength() >= CUPS_MIN_CHARS);

  private readonly searchParams = computed<CupsSearchParams>(() => ({
    term: this.debouncedTerm().trim(),
    feeScheduleId: this.data.feeScheduleId,
    attentionLevelId: this.data.attentionLevelId,
    page: this.page(),
  }));

  private readonly searchResource = rxResource({
    request: this.searchParams,
    loader: ({ request }) =>
      request.term.length >= CUPS_MIN_CHARS
        ? this.catalogApi
            .searchCups(request.term, request.feeScheduleId, request.page, CUPS_PAGE_SIZE, request.attentionLevelId)
            .pipe(map((resp) => ({ ...resp, page: request.page })))
        : of({ ...EMPTY_PAGE, page: request.page }),
  });

  readonly isLoading = computed(() => this.searchResource.isLoading());

  readonly error = computed(() =>
    this.searchResource.error()
      ? getHttpErrorMessage(this.searchResource.error(), ADMISSION_MESSAGES.CUPS_SEARCH_ERROR)
      : null,
  );

  readonly hasMore = computed(() => this.items().length < this.total());
  readonly summary = computed(() => (this.total() === 0 ? '' : `${this.items().length} de ${this.total()}`));

  constructor() {
    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      if (this.debouncedTerm().trim().length >= CUPS_MIN_CHARS) this.page.set(1);
    });

    effect(() => {
      const result = this.searchResource.value();
      if (!result) return;
      const params = this.searchParams();
      if (result.page !== params.page) return;
      this.total.set(result.total);
      if (params.term.length < CUPS_MIN_CHARS || result.page === 1) {
        this.items.set(result.items);
        return;
      }
      this.items.update((current) => [...current, ...result.items]);
    });
  }

  loadMore(): void {
    if (this.isLoading() || !this.searchable() || !this.hasMore()) return;
    this.page.update((current) => current + 1);
  }

  selectCups(item: CupsSearchItem): void {
    this.dialogRef.close(item);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
