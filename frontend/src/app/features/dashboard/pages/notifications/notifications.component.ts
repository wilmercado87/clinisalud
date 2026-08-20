import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { NotificationsListData, NotificationsListEvent, NotificationUI } from '@core/models/notification.model';
import { ToastService } from '@core/services/toast.service';
import { NotificationStore } from '@core/stores/notification-store/notification.store';
import { toNotificationUI } from '@core/utils/notification.mapper';
import { NotificationFilteredListComponent } from '@features/dashboard/components/notification-filtered-list/notification-filtered-list.component';
import { NOTIFICATION_MESSAGES } from '@shared/utils/messages';
import { PAGINATION } from '@shared/utils/pagination-constants';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, NotificationFilteredListComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly notificationStore = inject(NotificationStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly pageSize = PAGINATION.NOTIFICATIONS_PAGE_SIZE;
  public currentPage = signal(0);

  public unreadCount = this.notificationStore.unreadCount;

  public notifications = computed<NotificationUI[]>(() =>
    (this.notificationStore.notifications() ?? []).map(toNotificationUI),
  );

  public isLoadingNotifications = this.notificationStore.isLoadingNotifications;

  public hasUnread = computed(() => this.unreadCount() > 0);

  public listData = computed<NotificationsListData>(() => ({
    notifications: this.notifications(),
    isLoading: this.isLoadingNotifications(),
    hasError: false,
    hasUnread: this.hasUnread(),
    pageSize: this.pageSize,
    currentPage: this.currentPage(),
  }));

  constructor() {
    this.loadPage(0);

    effect(() => {
      if (this.notificationStore.markReadResult() !== undefined) {
        this.notificationStore.loadUnreadCount();
        this.loadPage(this.currentPage());
      }
    });

    effect(() => {
      if (this.notificationStore.markAllResult() !== undefined) {
        this.toast.success(NOTIFICATION_MESSAGES.MARKED_READ);
        this.notificationStore.loadUnreadCount();
        this.loadPage(this.currentPage());
      }
    });

    effect(() => {
      if (this.notificationStore.markReadError()) {
        this.toast.error(NOTIFICATION_MESSAGES.MARK_READ_ERROR);
      }
    });

    effect(() => {
      if (this.notificationStore.markAllError()) {
        this.toast.error(NOTIFICATION_MESSAGES.MARK_ALL_READ_ERROR);
      }
    });
  }

  public handleEvent(e: NotificationsListEvent): void {
    switch (e.type) {
      case 'markAsRead':
        if (!e.notification.isRead && !this.notificationStore.isMarkingRead()) {
          this.notificationStore.markAsRead(e.notification.recipientId);
        }
        if (e.notification.actionUrl) {
          this.router.navigateByUrl(e.notification.actionUrl);
        }
        break;
      case 'markAllAsRead':
        if (!this.notificationStore.isMarkingAll()) {
          this.notificationStore.markAllAsRead();
        }
        break;
      case 'reload':
        this.notificationStore.loadUnreadCount();
        this.loadPage(this.currentPage());
        break;
      case 'prevPage':
        this.currentPage.update((p) => Math.max(0, p - 1));
        this.loadPage(this.currentPage());
        break;
      case 'nextPage':
        this.currentPage.update((p) => p + 1);
        this.loadPage(this.currentPage());
        break;
    }
  }

  private loadPage(page: number): void {
    const offset = page * this.pageSize;
    this.notificationStore.loadNotifications(this.pageSize, offset);
  }

  public goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
