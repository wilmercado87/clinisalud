import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../models/auth.model';
import { ConfigService } from '../../../../core/services/config.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly configService = inject(ConfigService);

  private readonly loginTrigger = signal<LoginRequest | null>(null);

  public loginResource = rxResource({
    request: () => this.loginTrigger(),
    loader: ({ request: credentials }) => {
      if (!credentials) return of(null);
      return this.authService.login(credentials);
    }
  });

  public formStatus = signal('INVALID');

  public loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  public canSubmit = computed(() =>
    this.formStatus() === 'VALID' && !this.loginResource.isLoading()
  );

  public errorMessage = computed(() => {
    const err = this.loginResource.error() as any;
    return err;
  });


  constructor() {
    this.loginForm.statusChanges.subscribe(status => this.formStatus.set(status));

    this.registerEffects();
  }

  private registerEffects(): void {
    effect(() => {
      if (this.loginResource.value()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  public onLogin(): void {
    if (this.loginForm.invalid) return;

    this.loginTrigger.set(this.loginForm.getRawValue());
  }
}