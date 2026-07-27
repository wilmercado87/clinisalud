import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { AuthStore } from '../../../../core/stores/auth-store/auth.store';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly authStore = inject(AuthStore);

  public userName = computed(() =>
    this.authStore.currentUser()?.email.split('@')[0] || 'Usuario'
  );
}
