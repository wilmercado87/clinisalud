import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { NotificationUI } from '@core/models/notification.model';
import { NotificationStore } from '@core/stores/notification-store/notification.store';
import { toNotificationUI } from '@core/utils/notification.mapper';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, MatMenuModule],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  private readonly notificationStore = inject(NotificationStore);

  public isDropdownOpen = signal(false);

  public notifications = computed<NotificationUI[]>(() =>
    (this.notificationStore.notifications() ?? []).map(toNotificationUI),
  );

  public readonly unreadCount = this.notificationStore.unreadCount;

  public hasUnread = computed(() => this.unreadCount() > 0);

  public isLoadingNotifications = this.notificationStore.isLoadingNotifications;

  public toggleDropdown(): void {
    this.isDropdownOpen.update((v) => !v);
    if (this.isDropdownOpen()) {
      this.notificationStore.loadNotifications(5, 0);
      this.notificationStore.loadUnreadCount();
    }
  }

  public closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  public markAsRead(id: number, actionUrl?: string): void {
    if (this.notificationStore.isMarkingRead()) return;

    this.notificationStore.markAsRead(id);

    if (actionUrl) {
      this.isDropdownOpen.set(false);
      this.router.navigateByUrl(actionUrl);
    }
  }

  public markAllAsRead(): void {
    if (this.notificationStore.isMarkingAll()) return;
    this.notificationStore.markAllAsRead();
  }

  public viewAll(): void {
    this.isDropdownOpen.set(false);
    this.router.navigate(['/dashboard/notifications']);
  }
}
