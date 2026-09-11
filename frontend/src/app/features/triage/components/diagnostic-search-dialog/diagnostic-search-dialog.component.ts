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
import { DiagnosticoResponse } from '@core/models/catalog.model';
import { CatalogService } from '@core/services/catalog.service';
import { getHttpErrorMessage } from '@shared/utils/http-error';
import { TRIAGE_MESSAGES } from '@shared/utils/messages';
import { debounceTime, of } from 'rxjs';

export interface DiagnosticSearchDialogData {
  currentDiagnosticId: number | null;
}

const DIAGNOSTIC_MIN_CHARS = 3;

@Component({
  selector: 'app-diagnostic-search-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './diagnostic-search-dialog.component.html',
  styleUrl: './diagnostic-search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagnosticSearchDialogComponent {
  private readonly catalogApi = inject(CatalogService);
  private readonly dialogRef = inject(MatDialogRef<DiagnosticSearchDialogComponent>);
  public readonly data = inject<DiagnosticSearchDialogData>(MAT_DIALOG_DATA);

  readonly termControl = new FormControl('', { nonNullable: true });

  readonly minCharsHint = DIAGNOSTIC_MIN_CHARS;

  private readonly debouncedTerm = toSignal(this.termControl.valueChanges.pipe(debounceTime(300)), {
    initialValue: '',
  });

  readonly termLength = computed(() => this.debouncedTerm().trim().length);
  readonly searchable = computed(() => this.termLength() >= DIAGNOSTIC_MIN_CHARS);

  private readonly searchResource = rxResource({
    request: () => this.debouncedTerm().trim(),
    loader: ({ request }) =>
      request.length >= DIAGNOSTIC_MIN_CHARS ? this.catalogApi.searchDiagnostics(request) : of([]),
  });

  readonly items = computed(() => this.searchResource.value() ?? []);
  readonly isLoading = computed(() => this.searchResource.isLoading());

  readonly error = computed(() =>
    this.searchResource.error()
      ? getHttpErrorMessage(this.searchResource.error(), TRIAGE_MESSAGES.DIAGNOSTIC_SEARCH_ERROR)
      : null,
  );

  constructor() {
    effect(() => {
      const current = this.data.currentDiagnosticId;
      if (!current) return;
      const match = this.items().find((item) => item.id === current);
      if (match) this.prefillTerm(match);
    });
  }

  selectDiagnostic(item: DiagnosticoResponse): void {
    this.dialogRef.close(item);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private prefillTerm(item: DiagnosticoResponse): void {
    this.termControl.setValue(`${item.code} ${item.description}`.trim(), { emitEvent: false });
  }
}
