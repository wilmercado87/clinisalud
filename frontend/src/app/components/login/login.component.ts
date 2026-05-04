import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MaterialModule } from '../../material/material.module';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models/auth.model';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  public configService = inject(ConfigService);

  errorMessage: string | null = null;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.errorMessage = null;
    const credentials: LoginCredentials = this.loginForm.getRawValue();

    this.authService.login(credentials).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: m => this.errorMessage = m
    });
  }
}