import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';

export type AdmissionSearchMode = 'document' | 'admission';

const DOCUMENT_REQUIRED_MESSAGE = 'Número Documento requerido';

@Component({
  selector: 'app-admission-search',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    CatalogSelectComponent,
  ],
  templateUrl: './admission-search.component.html',
  styleUrl: './admission-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionSearchComponent {
  @ViewChild(CatalogSelectComponent) private readonly catalogSelect?: CatalogSelectComponent;

  readonly documentTypeIdControl = input.required<FormControl<number | null>>();
  readonly documentControl = input.required<FormControl<string>>();
  readonly admissionNumberControl = input<FormControl<string>>();
  readonly isSearching = input(false);
  readonly searchDisabled = input(false);
  readonly documentErrorMessage = input<string | null>(null);
  readonly resetToken = input(0);

  readonly mode = signal<AdmissionSearchMode>('document');

  private readonly searchAttempted = signal(false);

  readonly hasAdmissionSearch = computed(() => this.admissionNumberControl() !== undefined);

  readonly resolvedDocumentError = computed(() => {
    const control = this.documentControl();
    const isEmpty = !control.value?.trim();
    if (isEmpty && (this.searchAttempted() || control.touched || control.dirty)) {
      return DOCUMENT_REQUIRED_MESSAGE;
    }
    const externalMessage = this.documentErrorMessage();
    if (!externalMessage || isEmpty) return null;
    return control.touched || control.dirty ? externalMessage : null;
  });

  readonly searched = output<AdmissionSearchMode>();
  readonly documentBlurred = output<void>();
  readonly modeChanged = output<AdmissionSearchMode>();

  constructor() {
    effect(() => {
      const token = this.resetToken();
      if (token > 0) {
        untracked(() => this.reset());
      }
    });
  }

  setMode(mode: AdmissionSearchMode): void {
    if (this.mode() === mode) return;
    this.mode.set(mode);
    this.resetSearch();
    this.modeChanged.emit(mode);
  }

  reset(): void {
    this.resetSearch();
    this.catalogSelect?.forceReset();
  }

  onSearch(): void {
    if (this.searchDisabled() || this.isSearching()) return;
    if (this.mode() === 'document' && !this.hasCompleteDocumentSearch()) {
      this.searchAttempted.set(true);
      this.markDocumentControlsTouched();
      return;
    }
    this.searchAttempted.set(false);
    this.searched.emit(this.mode());
  }

  onBlur(): void {
    this.documentBlurred.emit();
    if (this.mode() === 'document' && !this.documentControl().value?.trim()) {
      this.searchAttempted.set(true);
      this.documentControl().markAsTouched();
    }
  }

  private hasCompleteDocumentSearch(): boolean {
    const documentTypeId = this.documentTypeIdControl().value;
    const document = this.documentControl().value?.trim() ?? '';
    return documentTypeId !== null && document.length > 0;
  }

  private markDocumentControlsTouched(): void {
    this.documentTypeIdControl().markAsTouched();
    this.documentControl().markAsTouched();
  }

  private resetSearch(): void {
    this.searchAttempted.set(false);
    this.documentTypeIdControl().reset();
    this.clearTextControl(this.documentControl());
    const admissionControl = this.admissionNumberControl();
    if (admissionControl) this.clearTextControl(admissionControl);
  }

  private clearTextControl(control: FormControl<string>): void {
    control.setValue('');
    control.markAsPristine();
    control.markAsUntouched();
  }
}
