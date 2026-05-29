import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../../../shared/material/material.module';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-profile-dialog',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<ProfileDialogComponent>);

  public readonly currentUser = computed(() => this.authService.currentUser);

  public profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    phone: ['', [Validators.pattern('^[0-9]{7,15}$')]],
    address: ['', [Validators.maxLength(255)]],
  });

  public updateTrigger = signal<Partial<{ firstName: string; lastName: string; phone: string; address: string }> | null>(null);

  public updateResource = rxResource({
    request: () => this.updateTrigger(),
    loader: ({ request: data }) => {
      if (!data) return of(undefined);
      return this.authService.updateProfile(data);
    },
  });

  public isValid = computed(() => this.formStatusSignal() === 'VALID');

  private readonly initialFormValue: Record<string, string | undefined>;

  private readonly formStatusSignal = toSignal(
    this.profileForm.statusChanges,
    { initialValue: this.profileForm.status }
  );

  private readonly formValueSignal = toSignal(
    this.profileForm.valueChanges,
    { initialValue: this.profileForm.getRawValue() },
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
    this.profileForm.patchValue(vals as any);
  }

  public hasChanges = computed(() => {
    const cur = this.formValueSignal() as Record<string, string | null | undefined> | null;
    if (!cur) return false;
    const keys = Object.keys(this.initialFormValue);
    return keys.some(k => cur[k] !== this.initialFormValue[k]);
  });

  public canSubmit = computed(() =>
    this.isValid() &&
    this.hasChanges() &&
    !this.updateResource.isLoading()
  );

  public onSubmit(): void {
    if (!this.canSubmit()) return;

    const raw = this.profileForm.getRawValue();
    const normalizedFormProfile: Record<string, string | undefined> = {};
    if (raw.firstName) normalizedFormProfile['firstName'] = raw.firstName;
    if (raw.lastName) normalizedFormProfile['lastName'] = raw.lastName;
    normalizedFormProfile['phone'] = raw.phone ?? undefined;
    normalizedFormProfile['address'] = raw.address ?? undefined;

    this.updateTrigger.set(normalizedFormProfile);
  }

  public onCancel(): void {
    this.dialogRef.close();
  }
}
