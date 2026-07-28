import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  template: `
    <div class="empty-state-container">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-message">{{ message() }}</p>
    </div>
  `,
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  public readonly title = input('No se encontraron resultados');
  public readonly message = input('Intenta ajustar los filtros de búsqueda.');
  public readonly icon = input('search_off');
}
