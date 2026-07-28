import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthStore } from '@core/stores/auth-store/auth.store';

@Component({
  selector: 'app-profile-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './profile-dialog.component.html',
  styleUrl: './profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly dialogRef = inject(MatDialogRef<ProfileDialogComponent>);

  public readonly currentUser = this.authStore.currentUser;
  public readonly isUpdatingProfile = this.authStore.isUpdatingProfile;
  public readonly updateResult = this.authStore.updateResult;
  public readonly updateError = this.authStore.updateError;

  public profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.pattern('^[0-9]{7,15}$')]],
    address: ['', [Validators.maxLength(255)]],
  });

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
    const cur = this.formValueSignal();
    if (!cur) return false;
    const keys = Object.keys(this.initialFormValue);
    return keys.some(k => (cur as Record<string, string | null | undefined>)[k] !== this.initialFormValue[k]);
  });

  public canSubmit = computed(() =>
    this.isValid() &&
    this.hasChanges() &&
    !this.isUpdatingProfile()
  );

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
  }

  public onSubmit(): void {
    if (!this.canSubmit()) return;

    const raw = this.profileForm.getRawValue();
    const normalized: Record<string, string | undefined> = {};
    if (raw.firstName) normalized['firstName'] = raw.firstName;
    if (raw.lastName) normalized['lastName'] = raw.lastName;
    normalized['phone'] = raw.phone ?? undefined;
    normalized['address'] = raw.address ?? undefined;

    this.authStore.updateProfile(normalized);
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
