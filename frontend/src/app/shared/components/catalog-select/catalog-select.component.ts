import {
  Component,
  input,
  forwardRef,
  inject,
  ChangeDetectionStrategy,
  signal,
  effect,
  computed,
  ViewChild,
  Injector,
  AfterViewInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher, MatOption } from '@angular/material/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { CatalogOptionUI, mapCatalogItemToOption } from '@shared/utils/catalog-mapper';

@Component({
  selector: 'app-catalog-select',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './catalog-select.component.html',
  styleUrl: './catalog-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CatalogSelectComponent),
      multi: true,
    },
  ],
})
export class CatalogSelectComponent implements ControlValueAccessor, AfterViewInit {
  private readonly catalogStore = inject(CatalogStore);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  private ngControlCache: NgControl | null | undefined;

  private get ngControl(): NgControl | null {
    if (this.ngControlCache === undefined) {
      this.ngControlCache = this.injector.get(NgControl, null, { self: true });
    }
    return this.ngControlCache;
  }

  @ViewChild(MatAutocompleteTrigger) private readonly autoTrigger?: MatAutocompleteTrigger;

  readonly catalogType = input.required<string>();
  readonly placeholder = input('Seleccione');
  readonly label = input('');

  readonly value = signal<number | null>(null);
  readonly disabled = signal(false);
  readonly searchTerm = signal('');
  readonly optionInvalid = signal(false);

  readonly inputControl = new FormControl('');

  readonly requiredState = signal(false);

  readonly isRequired = this.requiredState.asReadonly();

  readonly errorMatcher: ErrorStateMatcher = {
    isErrorState: () => this.optionInvalid(),
  };

  readonly errorMessage = computed(() =>
    this.optionInvalid() ? 'Ingreso no válido' : null,
  );

  private readonly loadTrigger = signal<string | null>(null);

  private readonly itemsResource = rxResource({
    request: () => this.loadTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogStore.loadCatalog(request);
    },
  });

  readonly isLoading = this.itemsResource.isLoading;

  readonly items = computed<CatalogOptionUI[]>(() => {
    const raw = this.itemsResource.value() ?? [];
    const type = this.catalogType();
    return raw.map((item) => mapCatalogItemToOption(type, item));
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.items();
    if (!term) return list;
    return list.filter((i) => i.description.toLowerCase().includes(term));
  });

  readonly selectedDescription = computed(() => {
    const id = this.value();
    if (id === null) return '';
    return this.items().find((i) => i.id === id)?.description ?? '';
  });

  readonly displayText = computed(() => {
    if (this.searchTerm()) return this.searchTerm();
    return this.selectedDescription();
  });

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.registerEffects();
  }

  ngAfterViewInit(): void {
    this.watchRequiredState();
  }

  private registerEffects(): void {
    effect(() => {
      const type = this.catalogType();
      if (type) this.loadTrigger.set(type);
    });

    effect(() => this.setInputEnabled(!this.disabled()));

    effect(() => {
      this.inputControl.setValue(this.displayText(), { emitEvent: false });
    });

    effect(() => {
      const id = this.value();
      if (id === null || this.searchTerm()) return;
      const item = this.items().find((i) => i.id === id);
      if (item) this.searchTerm.set(item.description);
    });
  }

  private setInputEnabled(enabled: boolean): void {
    if (enabled) {
      this.inputControl.enable({ emitEvent: false });
    } else {
      this.inputControl.disable({ emitEvent: false });
    }
  }

  private watchRequiredState(): void {
    const control = this.ngControl?.control;
    if (!control) return;
    const syncRequired = () =>
      this.requiredState.set(control.hasValidator(Validators.required));
    syncRequired();
    control.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(syncRequired);
  }

  onInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.syncOptionError();
  }

  private syncOptionError(): void {
    const term = this.searchTerm().trim();
    if (!term || this.isLoading() || this.items().length === 0) {
      this.setOptionError(false);
      return;
    }
    this.setOptionError(this.filteredItems().length === 0);
  }

  onFocus(): void {
    this.autoTrigger?.openPanel();
  }

  onBlur(): void {
    this.onTouched();
    const text = this.searchTerm().trim().toLowerCase();

    if (!text) {
      this.restoreSelectedDescription();
      return;
    }

    const match = this.items().find((i) => i.description.trim().toLowerCase() === text);
    if (!match) {
      this.value.set(null);
      this.onChange(null);
      this.setOptionError(true);
      return;
    }

    this.applyMatch(match);
  }

  private restoreSelectedDescription(): void {
    if (this.value() === null) return;
    this.searchTerm.set(this.selectedDescription());
  }

  private applyMatch(item: CatalogOptionUI): void {
    if (this.value() !== item.id) {
      this.value.set(item.id);
      this.onChange(item.id);
    }
    this.searchTerm.set(item.description);
    this.setOptionError(false);
  }

  onOptionSelected(option: MatOption<number>): void {
    const id = option.value;
    this.value.set(id);
    const item = this.items().find((i) => i.id === id);
    this.searchTerm.set(item?.description ?? '');
    this.setOptionError(false);
    this.onChange(id);
    this.onTouched();
  }

  onClear(): void {
    this.value.set(null);
    this.searchTerm.set('');
    this.setOptionError(false);
    this.onChange(null);
    this.onTouched();
  }

  writeValue(val: number | null | undefined): void {
    const id = val ?? null;
    this.value.set(id);
    if (id === null) {
      if (!this.optionInvalid()) this.searchTerm.set('');
      return;
    }
    this.setOptionError(false);
  }

  forceReset(): void {
    this.value.set(null);
    this.searchTerm.set('');
    this.setOptionError(false);
  }

  private setOptionError(invalid: boolean): void {
    this.optionInvalid.set(invalid);
    const control = this.ngControl?.control;
    if (!control) return;
    if (invalid) {
      control.setErrors({ ...(control.errors ?? {}), optionNotFound: true });
      return;
    }
    if (!control.hasError('optionNotFound')) return;
    const errors = { ...control.errors };
    delete errors['optionNotFound'];
    control.setErrors(Object.keys(errors).length > 0 ? errors : null);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
