import { Component, inject, signal, computed, ChangeDetectionStrategy, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AuthStore } from '@core/stores/auth-store/auth.store';
import { extractFieldErrors } from '@shared/utils/form-field-errors';
import { PASSWORD_CRITERIA, passwordValidator } from '@shared/utils/password-criteria';
import { PROFILE_ERROR_RULES } from './profile-form-validator';

type ProfileFormValue = {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  currentPassword: string | null;
  newPassword: string | null;
};

@Component({
  selector: 'app-profile-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSlideToggleModule],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly dialogRef = inject(MatDialogRef<ProfileDialogComponent>);
  private readonly destroyRef = inject(DestroyRef);

  public readonly currentUser = this.authStore.currentUser;
  public readonly isUpdatingProfile = this.authStore.isUpdatingProfile;
  public readonly isChangingPassword = this.authStore.isChangingPassword;
  public readonly updateResult = this.authStore.updateResult;
  public readonly updateError = this.authStore.updateError;

  public profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.pattern('^[0-9]{7,15}$')]],
    address: ['', [Validators.maxLength(255)]],
    currentPassword: [''],
    newPassword: [''],
  });

  public readonly changePasswordEnabled = signal(false);
  public readonly passwordChanged = signal(false);
  public readonly passwordChangeError = signal<string | null>(null);

  private readonly submitted = signal(false);
  private readonly profileUpdateRequested = signal(false);
  private readonly passwordChangeRequested = signal(false);
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly initialFormValue: Record<string, string | undefined>;

  private readonly formStatusSignal = toSignal(
    this.profileForm.statusChanges,
    { initialValue: this.profileForm.status }
  );

  private readonly formValueSignal = toSignal(
    this.profileForm.valueChanges,
    { initialValue: this.profileForm.getRawValue() },
  );

  public isValid = computed(() => this.formStatusSignal() === 'VALID');

  public hasChanges = computed(() => {
    if (this.changePasswordEnabled()) return true;
    const cur = this.formValueSignal();
    if (!cur) return false;
    const keys = Object.keys(this.initialFormValue);
    return keys.some(k => (cur as Record<string, string | null | undefined>)[k] !== this.initialFormValue[k]);
  });

  public canSubmit = computed(() =>
    this.isValid() &&
    this.hasChanges() &&
    !this.isUpdatingProfile() &&
    !this.isChangingPassword()
  );

  public readonly showUpdateSuccess = computed(() =>
    this.profileUpdateRequested() &&
    this.submitted() &&
    !!this.authStore.updateResult()
  );

  public readonly showUpdateError = computed(() =>
    this.profileUpdateRequested() &&
    this.submitted() &&
    !!this.authStore.updateError()
  );

  public readonly userErrors = computed(() => {
    this.formStatusSignal();
    this.formValueSignal();
    return extractFieldErrors(this.profileForm, PROFILE_ERROR_RULES);
  });

  public readonly passwordCriteria = computed(() => {
    this.formValueSignal();
    const newPassword = String(this.profileForm.controls.newPassword.value ?? '');
    const currentPassword = String(this.profileForm.controls.currentPassword.value ?? '');
    return [
      ...PASSWORD_CRITERIA.map((criterion) => ({
        key: criterion.key,
        label: criterion.label,
        met: criterion.test(newPassword),
      })),
      {
        key: 'different',
        label: 'Debe ser diferente a la contraseña actual',
        met: newPassword.length > 0 && newPassword !== currentPassword,
      },
    ];
  });

  constructor() {
    const user = this.currentUser();
    const vals: Record<string, string | undefined> = {
      firstName: user?.firstName,
      lastName: user?.lastName,
      phone: user?.phone || '',
      address: user?.address || '',
    };
    this.initialFormValue = vals;
    this.profileForm.patchValue(vals);

    this.destroyRef.onDestroy(() => {
      if (this.redirectTimeout) clearTimeout(this.redirectTimeout);
    });

    effect(() => {
      const result = this.authStore.changePasswordResult();
      const error = this.authStore.changePasswordError();
      if (!this.passwordChangeRequested()) return;

      if (result) {
        this.passwordChangeRequested.set(false);
        this.profileUpdateRequested.set(true);
        this.submitProfileUpdate(this.profileForm.getRawValue());
        this.passwordChanged.set(true);
        return;
      }

      if (error) {
        this.passwordChangeRequested.set(false);
        this.passwordChangeError.set(
          typeof error === 'string' ? error : 'Error al actualizar la contraseña. Intenta de nuevo.',
        );
      }
    });

    effect(() => {
      if (this.passwordChanged()) {
        this.redirectTimeout = setTimeout(() => this.logoutAfterPasswordChange(), 3000);
      }
    });
  }

  public togglePasswordChange(enabled: boolean): void {
    this.changePasswordEnabled.set(enabled);
    this.passwordChangeError.set(null);
    this.submitted.set(false);
    this.profileUpdateRequested.set(false);
    if (enabled) {
      this.authStore.resetPasswordChangeFeedback();
    }
    const controls = this.profileForm.controls;
    if (!enabled) {
      controls.currentPassword.setValue('');
      controls.newPassword.setValue('');
    }
    controls.currentPassword.setValidators(enabled ? [Validators.required] : []);
    controls.newPassword.setValidators(enabled ? [Validators.required, passwordValidator] : []);
    controls.currentPassword.markAsPristine();
    controls.currentPassword.markAsUntouched();
    controls.newPassword.markAsPristine();
    controls.newPassword.markAsUntouched();
    controls.currentPassword.updateValueAndValidity();
    controls.newPassword.updateValueAndValidity();
  }

  public onSubmit(): void {
    if (!this.canSubmit()) return;

    this.submitted.set(true);

    const raw = this.profileForm.getRawValue();

    if (this.changePasswordEnabled()) {
      this.profileUpdateRequested.set(false);
      this.passwordChangeRequested.set(true);
      this.passwordChangeError.set(null);
      this.authStore.changePassword({
        currentPassword: raw.currentPassword ?? '',
        newPassword: raw.newPassword ?? '',
      });
      return;
    }

    this.profileUpdateRequested.set(true);
    this.submitProfileUpdate(raw);
  }

  private submitProfileUpdate(raw: ProfileFormValue): void {
    const normalized: Record<string, string | undefined> = {};
    if (raw.firstName) normalized['firstName'] = raw.firstName;
    if (raw.lastName) normalized['lastName'] = raw.lastName;
    normalized['phone'] = raw.phone ?? undefined;
    normalized['address'] = raw.address ?? undefined;
    this.authStore.updateProfile(normalized);
  }

  public logoutAfterPasswordChange(): void {
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
      this.redirectTimeout = null;
    }
    this.dialogRef.close();
    this.authStore.logout();
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
