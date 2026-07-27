import { Component, inject, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '../../../../core/stores/auth-store/auth.store';
import { ConfigStore } from '../../../../core/stores/config-store/config.store';
import { ApiError } from '../../../../shared/utils/status.codes';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  public readonly configStore = inject(ConfigStore);

  public readonly isLoggingIn = this.authStore.isLoggingIn;

  public loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public formStatus = toSignal(this.loginForm.statusChanges, { initialValue: this.loginForm.status });

  public canSubmit = computed(() =>
    this.formStatus() === 'VALID' && !this.isLoggingIn()
  );

  public errorMessage = computed(() => {
    const err = this.authStore.loginError() as ApiError;
    return err;
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
}
