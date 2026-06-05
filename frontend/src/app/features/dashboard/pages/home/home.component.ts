import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly authService = inject(AuthService);

  public userName = computed(() =>
    this.authService.currentUser?.email.split('@')[0] || 'Usuario'
  );
}
