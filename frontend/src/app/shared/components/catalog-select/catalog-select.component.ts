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
  AbstractControl,
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
import { ErrorStateMatcher } from '@angular/material/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { CatalogDisplayItem, mapCatalogItemToDisplay } from '@shared/utils/catalog-mapper';

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

  readonly errorMessage = computed(() => {
    if (this.optionInvalid()) return 'Ingreso no válido';
    return null;
  });

  private readonly loadTrigger = signal<string | null>(null);

  private readonly itemsResource = rxResource({
    request: () => this.loadTrigger(),
    loader: ({ request }) => {
      if (!request) return of([]);
      return this.catalogStore.loadCatalog(request);
    },
  });

  readonly isLoading = this.itemsResource.isLoading;

  readonly items = computed<CatalogDisplayItem[]>(() => {
    const raw = this.itemsResource.value() ?? [];
    const type = this.catalogType();
    return raw.map((item: any) => mapCatalogItemToDisplay(type, item));
  });

  readonly filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.items();
    if (!term) return list;
    return list.filter((i) => i.description.toLowerCase().includes(term));
  });

  readonly selectedDescription = computed(() => {
    const id = this.value();
    if (id === null || id === undefined) return '';
    return this.items().find((i) => i.id === id)?.description ?? '';
  });

  readonly displayText = computed(() => {
    if (this.searchTerm()) return this.searchTerm();
    return this.selectedDescription();
  });

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const type = this.catalogType();
      if (type) this.loadTrigger.set(type);
    });

    effect(() => {
      if (this.disabled()) {
        this.inputControl.disable({ emitEvent: false });
      } else {
        this.inputControl.enable({ emitEvent: false });
      }
    });

    effect(() => {
      this.inputControl.setValue(this.displayText(), { emitEvent: false });
    });

    effect(() => {
      const id = this.value();
      const list = this.items();
      if (id !== null && id !== undefined && list.length > 0 && !this.searchTerm()) {
        const item = list.find((i) => i.id === id);
        if (item) this.searchTerm.set(item.description);
      }
    });
  }

  ngAfterViewInit(): void {
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
    const currentId = this.value();

    if (!text) {
      if (currentId !== null && currentId !== undefined) {
        this.searchTerm.set(this.selectedDescription());
      }
      return;
    }

    const match = this.items().find((i) => i.description.trim().toLowerCase() === text);
    if (match) {
      if (this.value() !== match.id) {
        this.value.set(match.id);
        this.onChange(match.id);
      }
      this.searchTerm.set(match.description);
      this.setOptionError(false);
    } else {
      this.value.set(null);
      this.onChange(null);
      this.setOptionError(true);
    }
  }

  onOptionSelected(option: any): void {
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

  writeValue(val: any): void {
    this.value.set(val ?? null);
    if (val === null || val === undefined) {
      if (!this.optionInvalid()) {
        this.searchTerm.set('');
        this.setOptionError(false);
      }
    } else {
      this.setOptionError(false);
    }
  }

  forceReset(): void {
    this.value.set(null);
    this.searchTerm.set('');
    this.setOptionError(false);
  }

  private setOptionError(invalid: boolean): void {
    this.optionInvalid.set(invalid);
    const control: AbstractControl | null = this.ngControl?.control ?? null;
    if (!control) return;
    if (invalid) {
      control.setErrors({ ...(control.errors ?? {}), optionNotFound: true });
    } else if (control.hasError('optionNotFound')) {
      const { optionNotFound: _removed, ...rest } = control.errors ?? {};
      control.setErrors(Object.keys(rest).length > 0 ? rest : null);
    }
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
