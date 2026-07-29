import { Component, input, forwardRef, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { CatalogItem } from '@core/models/catalog.model';

@Component({
  selector: 'app-catalog-select',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './catalog-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatalogSelectComponent),
      multi: true,
    },
  ],
})
export class CatalogSelectComponent implements ControlValueAccessor {
  private readonly catalogStore = inject(CatalogStore);

  readonly catalogType = input.required<string>();
  readonly placeholder = input('Seleccione');
  readonly multiple = input(false);
  readonly label = input('');

  readonly value = signal<number | number[] | null>(null);
  readonly disabled = signal(false);

  readonly items = signal<CatalogItem[]>([]);

  private readonly loadTrigger = signal<string | null>(null);

  private readonly itemsResource = rxResource({
    request: () => this.loadTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogStore.loadCatalog(request);
    },
  });

  readonly isLoading = this.itemsResource.isLoading;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const type = this.catalogType();
      if (type) this.loadTrigger.set(type);
    });

    effect(() => {
      const loaded = this.itemsResource.value();
      if (loaded) this.items.set(loaded);
    });
  }

  onSelectChange(selected: any): void {
    this.value.set(selected);
    this.onChange(selected);
    this.onTouched();
  }

  writeValue(val: any): void {
    this.value.set(val ?? null);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
