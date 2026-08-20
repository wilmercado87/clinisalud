import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@core/stores/auth-store/auth.store';
import { ConfigStore } from '@core/stores/config-store/config.store';
import { ForgotPasswordDialogComponent } from '@features/auth/components/forgot-password-dialog/forgot-password-dialog.component';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  public readonly configStore = inject(ConfigStore);

  public readonly isLoggingIn = this.authStore.isLoggingIn;

  public loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public formStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });

  public canSubmit = computed(() => this.formStatus() === 'VALID' && !this.isLoggingIn());

  public errorMessage = computed(() => {
    const err = this.authStore.loginError();
    return typeof err === 'string' ? err : null;
  });

  constructor() {
    effect(() => {
      if (this.authStore.loginResult()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  public onLogin(): void {
    if (this.loginForm.invalid) return;

    this.authStore.login(this.loginForm.getRawValue());
  }

  public openForgotPassword(): void {
    this.dialog.open(ForgotPasswordDialogComponent, {
      width: '460px',
      disableClose: true,
    });
  }
}
