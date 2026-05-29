import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-home',
    imports: [CommonModule],
    template: `
    <div class="welcome-container">
      <h1>Bienvenido, {{ userName }}</h1>
      <p>Este es el resumen médico de Clinisalud para hoy.</p>
    </div>
  `,
    styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly authService = inject(AuthService);

  get userName(): string {
    return this.authService.currentUser?.email.split('@')[0] || 'Usuario';
  }
}
