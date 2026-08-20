import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of } from 'rxjs';

import { AuthService } from '@core/services/auth.service';
import { extractFieldErrors } from '@shared/utils/form-field-errors';

const FORGOT_ERROR_RULES = {
  email: [
    ['required', 'El correo electrónico es requerido'],
    ['email', 'Ingrese un correo electrónico válido'],
  ],
} satisfies Record<string, [string, string][]>;

@Component({
  selector: 'app-forgot-password-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './forgot-password-dialog.component.html',
  styleUrl: './forgot-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<ForgotPasswordDialogComponent>);

  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly formStatusSignal = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  public readonly userErrors = computed(() => {
    this.formStatusSignal();
    return extractFieldErrors(this.form, FORGOT_ERROR_RULES);
  });

  private readonly sendTrigger = signal<{ email: string; attempt: number } | null>(null);

  private readonly sendResource = rxResource({
    request: () => this.sendTrigger(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.authService.forgotPassword(request.email);
    },
  });

  public readonly isSending = this.sendResource.isLoading;
  public readonly sent = computed(() => !!this.sendResource.value());
  public readonly sendError = this.sendResource.error;

  public canSubmit = computed(() => this.formStatusSignal() === 'VALID' && !this.isSending());

  public onSend(): void {
    if (!this.canSubmit()) return;
    this.sendTrigger.set({
      email: this.form.controls.email.value ?? '',
      attempt: Date.now(),
    });
  }

  public onClose(): void {
    this.dialogRef.close();
  }
}
