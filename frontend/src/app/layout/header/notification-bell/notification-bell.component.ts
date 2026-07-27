import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MaterialModule } from '../../../shared/material/material.module';
import { NotificationStore } from '../../../core/stores/notification-store/notification.store';
import { NotificationUI } from '../../../features/dashboard/models/notification.model';
import { toNotificationUI } from '../../../shared/utils/mapper-utils';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule, MaterialModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  private readonly notificationStore = inject(NotificationStore);

  public isDropdownOpen = signal(false);

  public notifications = computed<NotificationUI[]>(() =>
    (this.notificationStore.notifications() ?? []).map(toNotificationUI)
  );

  public readonly unreadCount = this.notificationStore.unreadCount;

  public hasUnread = computed(() => this.unreadCount() > 0);

  public isLoadingNotifications = this.notificationStore.isLoadingNotifications;

  public toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
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
