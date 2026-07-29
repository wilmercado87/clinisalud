import { Component, input, output, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { DiagnosticoItem, CupsItem } from '@core/models/catalog.model';

@Component({
  selector: 'app-catalog-search',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatProgressSpinnerModule],
  templateUrl: './catalog-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSearchComponent {
  private readonly catalogStore = inject(CatalogStore);

  readonly searchType = input.required<'diagnostics' | 'cups'>();
  readonly placeholder = input('Buscar...');
  readonly label = input('');

  readonly selected = output<DiagnosticoItem | CupsItem>();

  readonly query = signal('');
  readonly isSearching = signal(false);

  private readonly searchSubject = new Subject<string>();

  private readonly resultsSignal = toSignal(
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.isSearching.set(true)),
      switchMap((q) => {
        if (this.searchType() === 'diagnostics') {
          this.catalogStore.searchDiagnostics(q);
        } else {
          this.catalogStore.searchCups(q);
        }
        return this.searchType() === 'diagnostics'
          ? this.catalogStore.diagnostics
          : this.catalogStore.cups;
      }),
      tap(() => this.isSearching.set(false)),
    ),
    { initialValue: [] as (DiagnosticoItem | CupsItem)[] },
  );

  readonly results = this.resultsSignal;

  onInputChange(value: string): void {
    this.query.set(value);
    if (value.trim().length >= 2) {
      this.searchSubject.next(value.trim());
    }
  }

  onOptionSelected(option: any): void {
    this.selected.emit(option);
    this.query.set('');
  }

  displayFn(item: any): string {
    if (!item) return '';
    if ('code' in item) return `${item.code} — ${item.description}`;
    if ('mapiissCode' in item) return `${item.mapiissCode} — ${item.description}`;
    return '';
  }
}
