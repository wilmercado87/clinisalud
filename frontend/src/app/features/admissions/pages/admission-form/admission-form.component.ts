import { Component, inject, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AdmissionStore } from '@features/admissions/store/admission.store';
import { ToastService } from '@core/services/toast.service';
import { CatalogStore } from '@core/stores/catalog-store/catalog.store';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';

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
    CatalogSelectComponent,
  ],
  templateUrl: './admission-form.component.html',
  styleUrl: './admission-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdmissionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AdmissionStore);
  private readonly catalogStore = inject(CatalogStore);
  private readonly toast = inject(ToastService);

  readonly isCreating = this.store.isCreating;
  readonly createResult = this.store.createResult;
  readonly createError = this.store.createError;
  readonly isLookingUp = this.store.isLookingUp;
  readonly patientFound = this.store.patientFound;

  readonly beds = this.catalogStore.beds;
  readonly isLoadingBeds = this.catalogStore.isLoadingBeds;

  readonly isExistingPatient = signal(false);
  readonly showAuthorizations = signal(false);
  readonly authEntries = signal<FormGroup[]>([]);

  patientForm: FormGroup;
  admissionForm: FormGroup;

  authFormArray: FormGroup[] = [];

  constructor() {
    this.catalogStore.loadBeds(0);

    this.patientForm = this.fb.group({
      documentTypeId: [null, Validators.required],
      document: ['', Validators.required],
      firstName: [''],
      lastName: [''],
      birthDate: [''],
      genderId: [null],
      age: [''],
      disability: [''],
      userTypeId: [null],
      address: [''],
      phone: [''],
      email: [''],
    });

    this.admissionForm = this.fb.group({
      epsId: [null, Validators.required],
      roomId: [null, Validators.required],
      observations: [''],
    });

    effect(() => {
      const patient = this.patientFound();
      if (patient) {
        this.isExistingPatient.set(true);
        this.patientForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: patient.birthDate,
          genderId: patient.genderId,
          age: patient.age,
          disability: patient.disability,
          userTypeId: patient.userTypeId,
          address: patient.address,
          phone: patient.phone,
          email: patient.email,
        });
      }
    });

    effect(() => {
      const result = this.createResult();
      if (result && 'admissionNumber' in result) {
        this.toast.success(`Admisión ${result.admissionNumber} registrada correctamente`);
        this.resetForms();
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
    const doc = this.patientForm.get('document')?.value;
    if (!docTypeId || !doc) {
      this.toast.info('Seleccione tipo de documento e ingrese número');
      return;
    }
    this.isExistingPatient.set(false);
    this.patientForm.patchValue({
      firstName: '', lastName: '', birthDate: '', genderId: null,
      age: '', disability: '', userTypeId: null, address: '', phone: '', email: '',
    });
    this.store.lookupPatient(docTypeId, doc);
  }

  onSubmit(): void {
    if (this.admissionForm.invalid) {
      this.toast.info('Complete los campos requeridos de admisión');
      return;
    }

    const patient = this.patientForm.value;
    const admission = this.admissionForm.value;
    const isNew = !this.isExistingPatient();

    if (isNew && (!patient.firstName || !patient.lastName)) {
      this.toast.info('Nombre y apellido son requeridos para nuevo paciente');
      return;
    }

    const authorizations = this.showAuthorizations()
      ? this.authFormArray
          .filter(fg => fg.valid)
          .map(fg => fg.value)
      : undefined;

    this.store.createAdmission({
      isNewPatient: isNew,
      documentTypeId: patient.documentTypeId,
      document: patient.document,
      firstName: patient.firstName || undefined,
      lastName: patient.lastName || undefined,
      birthDate: patient.birthDate || undefined,
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
      authorizations,
    });
  }

  addAuthEntry(): void {
    const fg = this.fb.group({
      authTypeId: [null, Validators.required],
      authNumber: ['', Validators.required],
      mapiissCode: ['', Validators.required],
      quantity: [1],
    });
    this.authFormArray.push(fg);
    this.authEntries.set([...this.authFormArray]);
  }

  removeAuthEntry(index: number): void {
    this.authFormArray.splice(index, 1);
    this.authEntries.set([...this.authFormArray]);
  }

  private resetForms(): void {
    this.patientForm.reset();
    this.admissionForm.reset();
    this.isExistingPatient.set(false);
    this.showAuthorizations.set(false);
    this.authFormArray = [];
    this.authEntries.set([]);
    this.catalogStore.loadBeds(0);
  }
}
