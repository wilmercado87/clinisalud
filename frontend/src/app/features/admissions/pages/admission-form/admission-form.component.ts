import { Component, inject, effect, computed, ChangeDetectionStrategy, signal, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import {
  ADMISSION_ERROR_RULES,
  applyRequiredValidators,
  AUTH_ERROR_RULES,
  COMPANION_ERROR_RULES,
  COMPANION_FORMAT_VALIDATORS,
  COMPANION_REQUIRED_KEYS,
  createPatientFormatValidators,
  extractFieldErrors,
  PATIENT_ERROR_RULES,
  PATIENT_REQUIRED_KEYS,
} from '@features/admissions/utils/admission-form-validator';
import { ToastService } from '@core/services/toast.service';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import {
  ageValidator,
  disabilityValidator,
  maxDateValidator,
  numericValidator,
  parseIsoDateString,
  phoneValidator,
  startOfToday,
  toIsoDateString,
} from '@shared/utils/form-validators';

type FormMode = 'IDLE' | 'SEARCHING' | 'FOUND' | 'NOT_FOUND';

@Component({
  selector: 'app-admission-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CatalogSelectComponent,
  ],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AdmissionStore);
  private readonly toast = inject(ToastService);

  @ViewChildren(CatalogSelectComponent) private readonly catalogSelects!: QueryList<CatalogSelectComponent>;

  readonly today = startOfToday();

  private readonly patientFormatValidators = createPatientFormatValidators(this.today);

  private readonly errorsTrigger = signal(0);

  readonly patientErrors = computed(() => {
    this.errorsTrigger();
    return extractFieldErrors(this.patientForm, PATIENT_ERROR_RULES);
  });

  readonly companionErrors = computed(() => {
    this.errorsTrigger();
    return extractFieldErrors(this.companionForm, COMPANION_ERROR_RULES);
  });

  readonly admissionErrors = computed(() => {
    this.errorsTrigger();
    return extractFieldErrors(this.admissionForm, ADMISSION_ERROR_RULES);
  });

  readonly authErrors = computed(() => {
    this.errorsTrigger();
    return this.authEntries().map((fg) => extractFieldErrors(fg, AUTH_ERROR_RULES));
  });

  readonly mode = signal<FormMode>('IDLE');
  private lookupRequested = false;

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;

  readonly showAuthorizations = signal(false);
  readonly authEntries = signal<FormGroup[]>([]);
  readonly companionActive = signal(false);
  readonly canSubmit = signal(false);

  patientForm: FormGroup;
  companionForm: FormGroup;
  admissionForm: FormGroup;

  authFormArray: FormGroup[] = [];

  constructor() {
    this.patientForm = this.fb.group({
      documentTypeId: [null, Validators.required],
      document: ['', [Validators.required, numericValidator]],
      firstName: [''],
      lastName: [''],
      birthDate: [null, [maxDateValidator(this.today)]],
      genderId: [null],
      age: ['', ageValidator],
      disability: ['', disabilityValidator],
      userTypeId: [null],
      address: [''],
      phone: ['', phoneValidator],
      email: ['', Validators.email],
    });

    this.companionForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      documentTypeId: [null],
      document: ['', numericValidator],
      address: [''],
      relationshipId: [null],
      phone: ['', phoneValidator],
    });

    this.admissionForm = this.fb.group({
      epsId: [null, Validators.required],
      roomId: [null, Validators.required],
      observations: ['', Validators.required],
    });

    this.applyFormState();

    effect(() => {
      applyRequiredValidators(
        this.patientForm,
        PATIENT_REQUIRED_KEYS,
        this.patientFormatValidators,
        this.mode() === 'NOT_FOUND',
      );
    });

    this.companionForm.get('firstName')?.valueChanges.subscribe(() => this.refreshCompanionValidators());
    this.companionForm.get('lastName')?.valueChanges.subscribe(() => this.refreshCompanionValidators());

    this.patientForm.get('birthDate')?.valueChanges.subscribe((date: Date | string | null) => {
      const age = this.calculateAge(date);
      this.patientForm.get('age')?.setValue(age, { emitEvent: false });
    });

    effect(() => this.refreshCanSubmit());

    this.patientForm.statusChanges.subscribe(() => this.onFormStatusChange());
    this.companionForm.statusChanges.subscribe(() => this.onFormStatusChange());
    this.admissionForm.statusChanges.subscribe(() => this.onFormStatusChange());

    effect(() => {
      const loading = this.store.isLookingUp;
      const patient = this.store.patientFound();
      const err = this.store.lookupError();
      if (!this.lookupRequested || loading()) return;
      this.lookupRequested = false;

      if (err) {
        if ((err as any)?.status === 404) {
          this.mode.set('NOT_FOUND');
        } else {
          this.mode.set('IDLE');
          this.toast.error((err as any)?.error?.message || 'Error al buscar el paciente');
        }
      } else if (patient) {
        this.mode.set('FOUND');
        this.patientForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: parseIsoDateString(patient.birthDate) ?? null,
          genderId: patient.genderId,
          age: patient.age,
          disability: patient.disability,
          userTypeId: patient.userTypeId,
          address: patient.address,
          phone: patient.phone,
          email: patient.email,
        });
        this.admissionForm.patchValue({ epsId: patient.epsId ?? null });
      } else {
        this.mode.set('NOT_FOUND');
      }
      this.applyFormState();
    });

    effect(() => {
      const result = this.createResult();
      if (result && 'admissionNumber' in result) {
        this.toast.success(`Admisión ${result.admissionNumber} registrada correctamente`);
        this.resetAll();
      }
    });

    effect(() => {
      const err = this.createError();
      if (err) {
        this.toast.error((err as any).error?.message || 'Error al registrar admisión');
      }
    });
  }

  onSearchPatient(): void {
    const docTypeId = this.patientForm.get('documentTypeId')?.value;
    const doc = this.patientForm.get('document')?.value?.trim();
    if (!docTypeId || !doc) {
      this.toast.info('Seleccione tipo de documento e ingrese número');
      return;
    }

    this.mode.set('SEARCHING');
    this.applyFormState();
    this.lookupRequested = true;
    this.store.lookupPatient(docTypeId, doc);
  }

  onDocumentBlur(): void {
    if (this.mode() !== 'IDLE') return;
    const doc = this.patientForm.get('document')?.value?.trim();
    if (!doc) return;
    setTimeout(() => {
      if (this.mode() === 'IDLE') this.onSearchPatient();
    }, 150);
  }

  onCancel(): void {
    this.resetAll();
  }

  onSubmit(): void {
    if (this.mode() !== 'NOT_FOUND' && this.mode() !== 'FOUND') {
      this.toast.info('Busque primero el paciente');
      return;
    }

    if (this.admissionForm.invalid) {
      this.toast.info('Complete los campos requeridos de admisión');
      return;
    }

    const patient = this.patientForm.getRawValue();
    const companion = this.companionForm.getRawValue();
    const admission = this.admissionForm.getRawValue();
    const isNew = this.mode() === 'NOT_FOUND';

    if (isNew && (!patient.firstName || !patient.lastName)) {
      this.toast.info('Nombre y apellido son requeridos para nuevo paciente');
      return;
    }

    const birthDateValue = patient.birthDate;
    const birthDate =
      birthDateValue instanceof Date ? toIsoDateString(birthDateValue) : (birthDateValue || undefined);

    const hasCompanion = Object.values(companion).some(
      (v) => v !== null && v !== undefined && v !== '',
    );
    const companionData = hasCompanion
      ? {
          firstName: companion.firstName,
          lastName: companion.lastName,
          documentTypeId: companion.documentTypeId,
          document: companion.document,
          address: companion.address,
          relationshipId: companion.relationshipId,
          phone: companion.phone,
        }
      : undefined;

    const authorizations = this.showAuthorizations()
      ? this.authFormArray
          .filter((fg) => fg.valid)
          .map((fg) => fg.value)
      : undefined;

    this.store.createAdmission({
      isNewPatient: isNew,
      documentTypeId: patient.documentTypeId,
      document: patient.document,
      firstName: patient.firstName || undefined,
      lastName: patient.lastName || undefined,
      birthDate,
      genderId: patient.genderId || undefined,
      age: patient.age || undefined,
      disability: patient.disability || undefined,
      userTypeId: patient.userTypeId || undefined,
      address: patient.address || undefined,
      phone: patient.phone || undefined,
      email: patient.email || undefined,
      epsId: admission.epsId,
      roomId: admission.roomId,
      observations: admission.observations || undefined,
      companion: companionData,
      authorizations,
    });
  }

  addAuthEntry(): void {
    const fg = this.fb.group({
      authTypeId: [null, Validators.required],
      authNumber: ['', Validators.required],
      mapiissCode: ['', Validators.required],
      quantity: [1, [Validators.required, numericValidator, Validators.min(1)]],
    });
    fg.statusChanges.subscribe(() => this.onFormStatusChange());
    this.authFormArray.push(fg);
    this.authEntries.set([...this.authFormArray]);
    this.refreshCanSubmit();
  }

  removeAuthEntry(index: number): void {
    this.authFormArray.splice(index, 1);
    this.authEntries.set([...this.authFormArray]);
    this.refreshCanSubmit();
  }

  private onFormStatusChange(): void {
    this.errorsTrigger.update((n) => n + 1);
    this.refreshCanSubmit();
  }

  private calculateAge(birthDate: Date | string | null | undefined): string {
    if (!birthDate) return '';
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years >= 0 ? String(years) : '';
  }

  private applyFormState(): void {
    const m = this.mode();
    const searchEnabled = m === 'IDLE' || m === 'NOT_FOUND';
    const dataEnabled = m === 'NOT_FOUND' || m === 'FOUND';

    this.setControl(this.patientForm, 'documentTypeId', searchEnabled);
    this.setControl(this.patientForm, 'document', searchEnabled);

    const patientKeys = [
      'firstName',
      'lastName',
      'birthDate',
      'genderId',
      'age',
      'disability',
      'userTypeId',
      'address',
      'phone',
      'email',
    ];
    patientKeys.forEach((k) => this.setControl(this.patientForm, k, dataEnabled));

    Object.keys(this.companionForm.controls).forEach((k) =>
      this.setControl(this.companionForm, k, dataEnabled),
    );

    ['epsId', 'roomId', 'observations'].forEach((k) =>
      this.setControl(this.admissionForm, k, dataEnabled),
    );
  }

  private setControl(group: FormGroup, key: string, enabled: boolean): void {
    const control = group.get(key);
    if (!control) return;
    if (enabled) {
      control.enable({ emitEvent: false });
    } else {
      control.disable({ emitEvent: false });
    }
  }

  private refreshCompanionValidators(): void {
    const firstName = this.companionForm.get('firstName')?.value?.trim();
    const lastName = this.companionForm.get('lastName')?.value?.trim();
    const active = Boolean(firstName || lastName);
    this.companionActive.set(active);
    applyRequiredValidators(
      this.companionForm,
      COMPANION_REQUIRED_KEYS,
      COMPANION_FORMAT_VALIDATORS,
      active,
    );
  }

  private refreshCanSubmit(): void {
    const authorizationsValid =
      !this.showAuthorizations() || this.authFormArray.every((fg) => fg.valid);
    this.canSubmit.set(
      (this.mode() === 'NOT_FOUND' || this.mode() === 'FOUND') &&
        this.patientForm.valid &&
        this.companionForm.valid &&
        this.admissionForm.valid &&
        authorizationsValid &&
        !this.isCreating(),
    );
  }

  private resetAll(): void {
    this.patientForm.reset();
    this.companionForm.reset();
    this.admissionForm.reset();
    this.catalogSelects?.forEach((select) => select.forceReset());
    this.showAuthorizations.set(false);
    this.authFormArray = [];
    this.authEntries.set([]);
    this.mode.set('IDLE');
    this.applyFormState();
  }
}
