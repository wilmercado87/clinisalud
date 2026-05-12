import { Component, inject, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../material/material.module';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models/auth.model';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  public readonly configService = inject(ConfigService);

  private loginTrigger = signal<LoginCredentials | null>(null);

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
    return err ? (typeof err === 'string' ? err : 'Error de conexión') : null;
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