import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);

  readonly refreshCounter = signal(0);

  private readonly fetchParams = signal<{ limit: number; offset: number }>({ limit: 5, offset: 0 });

  private readonly notificationsResource = rxResource({
    request: () => this.fetchParams(),
    loader: ({ request }) =>
      this.notificationService.getNotifications(request.limit, request.offset),
  });

  private readonly unreadResource = rxResource({
    loader: () => this.notificationService.getUnreadCount(),
  });

  readonly notifications = this.notificationsResource.value.asReadonly();
  readonly isLoadingNotifications = this.notificationsResource.isLoading;

  readonly unreadCount = computed(() => this.unreadResource.value()?.count ?? 0);
  readonly isLoadingUnread = this.unreadResource.isLoading;

  private readonly markReadTrigger = signal<{ id: number } | null>(null);

  private readonly markReadResource = rxResource({
    request: () => this.markReadTrigger(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.notificationService.markAsRead(request.id);
    },
  });

  readonly markReadResult = this.markReadResource.value.asReadonly();
  readonly isMarkingRead = this.markReadResource.isLoading;
  readonly markReadError = this.markReadResource.error;

  private readonly markAllTrigger = signal(0);

  private readonly markAllResource = rxResource({
    request: () => this.markAllTrigger(),
    loader: ({ request }) => {
      if (request === 0) return of(undefined);
      return this.notificationService.markAllAsRead();
    },
  });

  readonly markAllResult = this.markAllResource.value.asReadonly();
  readonly isMarkingAll = this.markAllResource.isLoading;
  readonly markAllError = this.markAllResource.error;

  constructor() {
    effect(() => {
      if (this.socketService.onNotification()) {
        this.refreshCounter.update(n => n + 1);
      }
    });
  }

  loadNotifications(limit: number, offset: number): void {
    this.fetchParams.set({ limit, offset });
  }

  loadUnreadCount(): void {
    this.unreadResource.reload();
  }

  markAsRead(id: number): void {
    this.markReadTrigger.set({ id });
  }

  markAllAsRead(): void {
    this.markAllTrigger.update(n => n + 1);
  }
}
