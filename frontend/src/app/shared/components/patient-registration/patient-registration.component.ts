import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { CatalogSelectComponent } from '@shared/components/catalog-select/catalog-select.component';
import { FieldErrors } from '@shared/utils/form-field-errors';
import { PatientForm } from '@shared/utils/patient/patient-form.types';
import { PATIENT_ERROR_RULES } from '@shared/utils/patient/patient-form.validator';
import { startOfToday } from '@shared/utils/form-validators';

export type PatientRegistrationErrors = Partial<FieldErrors<typeof PATIENT_ERROR_RULES>>;

@Component({
  selector: 'app-patient-registration',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CatalogSelectComponent,
  ],
  templateUrl: './patient-registration.component.html',
  styleUrl: './patient-registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientRegistrationComponent {
  readonly patientForm = input.required<PatientForm>();
  readonly required = input(false);
  readonly errors = input<PatientRegistrationErrors>({});

  readonly maxBirthDate = startOfToday();
}
