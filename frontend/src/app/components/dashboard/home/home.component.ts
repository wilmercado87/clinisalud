import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="welcome-container">
      <h1>Bienvenido, {{ userName }}</h1>
      <p>Este es el resumen médico de Clinisalud para hoy.</p>
    </div>
  `,
  styles: [
    `
      .welcome-container {
        padding: 20px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        color: #004071;
      }
    `,
  ],
})
export class HomeComponent {
  private authService = inject(AuthService);

  get userName(): string {
    return this.authService.currentUser?.email.split('@')[0] || 'Usuario';
  }
}
