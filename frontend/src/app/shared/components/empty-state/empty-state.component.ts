import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-empty-state',
    imports: [MatIconModule],
    template: `
    <div class="empty-state-container">
      <mat-icon class="empty-icon">{{ icono }}</mat-icon>
      <h3 class="empty-title">{{ titulo }}</h3>
      <p class="empty-message">{{ mensaje }}</p>
    </div>
  `,
    styleUrl: './empty-state.component.scss',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() titulo: string = 'No se encontraron resultados';
  @Input() mensaje: string = 'Intenta ajustar los filtros de búsqueda.';
  @Input() icono: string = 'search_off';
}
