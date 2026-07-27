import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MaterialModule } from '../../../../shared/material/material.module';
import { NotificationStore } from '../../../../core/stores/notification-store/notification.store';
import { ToastService } from '../../../../core/services/toast.service';
import { toNotificationUI } from '../../../../shared/utils/mapper-utils';
import { PAGINATION } from '../../../../shared/utils/pagination-constants';
import { NotificationFilteredListComponent } from '../../components/notification-filtered-list/notification-filtered-list.component';
import {
  NotificationsListData,
  NotificationsListEvent,
  NotificationUI,
} from '../../../dashboard/models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, MaterialModule, NotificationFilteredListComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
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
    (this.notificationStore.notifications() ?? []).map(toNotificationUI)
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
        this.toast.success('Notificaciones marcadas como leídas');
        this.notificationStore.loadUnreadCount();
        this.loadPage(this.currentPage());
      }
    });

    effect(() => {
      if (this.notificationStore.markReadError()) {
        this.toast.error('Error al marcar notificación');
      }
    });

    effect(() => {
      if (this.notificationStore.markAllError()) {
        this.toast.error('Error al marcar notificaciones');
      }
    });
  }

  public handleEvent(e: NotificationsListEvent): void {
    switch (e.type) {
      case 'markAsRead':
        if (e.notification.isRead && !this.notificationStore.isMarkingRead()) break;
        this.notificationStore.markAsRead(e.notification.recipientId);
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
        this.currentPage.update(p => Math.max(0, p - 1));
        this.loadPage(this.currentPage());
        break;
      case 'nextPage':
        this.currentPage.update(p => p + 1);
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
