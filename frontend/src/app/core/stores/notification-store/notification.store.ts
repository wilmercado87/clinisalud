import { Injectable, inject, signal, effect, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, tap } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { SocketService } from '@core/services/socket.service';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);

  readonly refreshCounter = signal(0);

  private readonly fetchParams = signal<{ limit: number; offset: number } | null>({ limit: 5, offset: 0 });

  private readonly reloadParams = computed(() => {
    const params = this.fetchParams();
    if (!params) return null;
    return {
      limit: params.limit,
      offset: params.offset,
      refreshKey: this.refreshCounter(),
    };
  });

  private readonly notificationsResource = rxResource({
    request: () => this.reloadParams(),
    loader: ({ request }) => {
      if (!request) return of(undefined);
      return this.notificationService.getNotifications(request.limit, request.offset);
    },
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
      return this.notificationService.markAsRead(request.id).pipe(
        tap(() => {
          this.loadUnreadCount();
          this.refreshCounter.update((n) => n + 1);
        }),
      );
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
      return this.notificationService.markAllAsRead().pipe(
        tap(() => {
          this.loadUnreadCount();
          this.refreshCounter.update((n) => n + 1);
        }),
      );
    },
  });

  readonly markAllResult = this.markAllResource.value.asReadonly();
  readonly isMarkingAll = this.markAllResource.isLoading;
  readonly markAllError = this.markAllResource.error;

  constructor() {
    effect(() => {
      const seq = this.socketService.notificationSeq();
      const event = this.socketService.onNotification();
      if (seq > 0 && event) {
        this.refreshCounter.update((n) => n + 1);
        this.loadUnreadCount();
      }
    });
  }

  loadNotifications(limit: number, offset: number): void {
    this.fetchParams.set({ limit, offset });
  }

  loadUnreadCount(): void {
    this.unreadResource.reload();
  }

  reloadAll(): void {
    this.fetchParams.set(this.fetchParams() ?? { limit: 5, offset: 0 });
    this.refreshCounter.update((n) => n + 1);
    this.loadUnreadCount();
  }

  markAsRead(id: number): void {
    this.markReadTrigger.set({ id });
  }

  markAllAsRead(): void {
    this.markAllTrigger.update(n => n + 1);
  }

  reset(): void {
    this.fetchParams.set(null);
    this.refreshCounter.set(0);
    this.markReadTrigger.set(null);
    this.markAllTrigger.set(0);
  }
}
