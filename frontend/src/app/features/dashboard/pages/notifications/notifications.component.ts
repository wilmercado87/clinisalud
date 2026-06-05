import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { MaterialModule } from '../../../../shared/material/material.module';
import { NotificationService } from '../../../../core/services/notification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { toNotificationUI } from '../../../../core/utils/mapper-utils';
import { PAGINATION } from '../../../../core/utils/pagination-constants';
import { ApiError } from '../../../../core/utils/status.codes';
import { NotificationFilteredListComponent } from '../../components/notification-filtered-list/notification-filtered-list.component';
import {
  NotificationsListData,
  NotificationsListEvent,
  NotificationUI,
} from '../../../../models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, MaterialModule, NotificationFilteredListComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsComponent {
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  public readonly pageSize = PAGINATION.NOTIFICATIONS_PAGE_SIZE;
  public currentPage = signal(0);
  private readonly loadTrigger = signal(0);

  public notificationsResource = rxResource({
    request: () => ({ page: this.currentPage(), tick: this.loadTrigger() }),
    loader: ({ request }) => {
      const offset = request.page * this.pageSize;
      return this.notificationService.getNotifications(this.pageSize, offset);
    },
  });

  public notifications = computed<NotificationUI[]>(() =>
    (this.notificationsResource.value() ?? []).map(toNotificationUI)
  );

  public unreadCountResource = rxResource({
    loader: () => this.notificationService.getUnreadCount(),
  });

  public hasUnread = computed(() => (this.unreadCountResource.value()?.count ?? 0) > 0);

  public listData = computed<NotificationsListData>(() => ({
    notifications: this.notifications(),
    isLoading: this.notificationsResource.isLoading(),
    hasError: !!this.notificationsResource.error(),
    hasUnread: this.hasUnread(),
    pageSize: this.pageSize,
    currentPage: this.currentPage(),
  }));

  public markReadTrigger = signal<number | null>(null);

  public markReadResource = rxResource({
    request: () => this.markReadTrigger(),
    loader: ({ request: id }) => {
      if (id === null) return of(undefined);
      return this.notificationService.markAsRead(id);
    },
  });

  private readonly markAllTrigger = signal(0);

  public markAllResource = rxResource({
    request: () => this.markAllTrigger(),
    loader: ({ request: t }) => {
      if (t === 0) return of(undefined);
      return this.notificationService.markAllAsRead();
    },
  });

  constructor() {
    effect(() => {
      if (this.markReadResource.value() !== undefined) {
        this.notificationsResource.reload();
        this.unreadCountResource.reload();
        this.markReadTrigger.set(null);
      }
    });

    effect(() => {
      if (this.markAllResource.value() !== undefined) {
        this.toast.success('Notificaciones marcadas como leídas');
        this.notificationsResource.reload();
        this.unreadCountResource.reload();
      }
    });

    effect(() => {
      const err = this.markReadResource.error() as ApiError;
      if (err) {
        this.toast.error('Error al marcar notificación');
        this.markReadTrigger.set(null);
      }
    });

    effect(() => {
      if (this.markAllResource.error()) {
        this.toast.error('Error al marcar notificaciones');
      }
    });
  }

  public handleEvent(e: NotificationsListEvent): void {
    switch (e.type) {
      case 'markAsRead':
        if (!e.notification.isRead && !this.markReadResource.isLoading()) {
          this.markReadTrigger.set(e.notification.recipientId);
          if (e.notification.actionUrl) {
            this.router.navigateByUrl(e.notification.actionUrl);
          }
        }
        break;
      case 'markAllAsRead':
        if (!this.markAllResource.isLoading()) {
          this.markAllTrigger.update(n => n + 1);
        }
        break;
      case 'reload':
        this.notificationsResource.reload();
        this.unreadCountResource.reload();
        break;
      case 'prevPage':
        this.currentPage.update(p => Math.max(0, p - 1));
        break;
      case 'nextPage':
        this.currentPage.update(p => p + 1);
        break;
    }
  }

  public goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
