import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-empty-state',
    template: `
    <div class="empty-state-container">
      <mat-icon class="empty-icon">{{ icono }}</mat-icon>
      <h3 class="empty-title">{{ titulo }}</h3>
      <p class="empty-message">{{ mensaje }}</p>
    </div>
  `,
    styles: [
        `
      .empty-state-container {
        padding: 60px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      .empty-icon {
        font-size: 64px;
        height: 64px;
        width: 64px;
        margin-bottom: 16px;
        color: #cbd5e0;
      }
      .empty-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1a237e;
      }
      .empty-message {
        margin: 8px 0 0;
        font-size: 0.95rem;
        color: #666;
        max-width: 350px;
      }
    `,
    ],
    standalone: false
})
export class EmptyStateComponent {
  @Input() titulo: string = 'No se encontraron resultados';
  @Input() mensaje: string = 'Intenta ajustar los filtros de búsqueda.';
  @Input() icono: string = 'search_off';
}
