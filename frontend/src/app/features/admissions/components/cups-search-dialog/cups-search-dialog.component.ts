import {
  Component,
  computed,
  DestroyRef,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { CatalogService } from '@core/services/catalog.service';
import { CupsSearchItem } from '@core/models/catalog.model';
import { getHttpErrorMessage } from '@shared/utils/http-error';

export interface CupsSearchDialogData {
  feeScheduleId: number;
  feeScheduleName: string;
}

const CUPS_MIN_CHARS = 3;
const CUPS_PAGE_SIZE = 20;

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
  private readonly destroyRef = inject(DestroyRef);
  public readonly data = inject<CupsSearchDialogData>(MAT_DIALOG_DATA);

  readonly termControl = new FormControl('', { nonNullable: true });

  readonly term = signal('');
  readonly items = signal<CupsSearchItem[]>([]);
  readonly total = signal(0);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly page = signal(1);

  readonly minCharsHint = CUPS_MIN_CHARS;
  readonly termLength = computed(() => this.term().trim().length);
  readonly searchable = computed(() => this.termLength() >= CUPS_MIN_CHARS);
  readonly hasMore = computed(() => this.items().length < this.total());
  readonly summary = computed(() =>
    this.total() === 0 ? '' : `${this.items().length} de ${this.total()}`,
  );

  constructor() {
    this.termControl.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.term.set(term);
        this.fetchPage(term, 1);
      });
  }

  fetchPage(term: string, page: number): void {
    const normalized = term.trim();
    if (normalized.length < CUPS_MIN_CHARS) {
      this.items.set([]);
      this.total.set(0);
      this.error.set(null);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.catalogApi
      .searchCups(normalized, this.data.feeScheduleId, page, CUPS_PAGE_SIZE)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.total.set(result.total);
          this.page.set(page);
          this.items.update((current) =>
            page === 1 ? result.items : [...current, ...result.items],
          );
          this.isLoading.set(false);
        },
        error: (err: unknown) => {
          this.isLoading.set(false);
          this.error.set(getHttpErrorMessage(err, 'Error al buscar CUPS'));
        },
      });
  }

  loadMore(): void {
    if (this.isLoading() || !this.searchable() || !this.hasMore()) return;
    this.fetchPage(this.term(), this.page() + 1);
  }

  selectCups(item: CupsSearchItem): void {
    this.dialogRef.close(item);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}