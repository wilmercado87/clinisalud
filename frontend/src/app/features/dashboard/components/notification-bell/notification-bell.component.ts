import { Component, inject, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';

import { MaterialModule } from '../../../../shared/material/material.module';
import { NotificationService } from '../../../../core/services/notification.service';
import { SocketService } from '../../../../core/services/socket.service';
import { NotificationResponse, NotificationUI } from '../../../../models/notification.model';
import { formatRelativeTime } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-notification-bell',
  imports: [CommonModule, MaterialModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly socketService = inject(SocketService);

  public isDropdownOpen = signal(false);

  private readonly tick = toSignal(interval(60000), { initialValue: 0 });
  private readonly manualReload = signal(0);
  private readonly reloadTrigger = computed(() => this.manualReload() + this.tick());

  public unreadResource = rxResource({
    request: () => this.reloadTrigger(),
    loader: () => this.notificationService.getUnreadCount(),
  });

  public recentResource = rxResource({
    request: () => this.reloadTrigger(),
    loader: () => this.notificationService.getNotifications(5, 0),
  });

  public notifications = computed<NotificationUI[]>(() =>
    (this.recentResource.value() ?? []).map(n => ({
      ...n,
      timeAgo: formatRelativeTime(n.createdAt),
      isUnread: !n.isRead,
      createdAtDate: new Date(n.createdAt),
    }))
  );

  public unreadCount = computed(() => this.unreadResource.value()?.count ?? 0);

  public hasUnread = computed(() => this.unreadCount() > 0);

  private readonly markReadTrigger = signal<number | null>(null);

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
      if (this.socketService.onNotification()) {
        this.manualReload.update(n => n + 1);
      }
    });

    effect(() => {
      if (this.markReadResource.value() !== undefined) {
        this.manualReload.update(n => n + 1);
        this.markReadTrigger.set(null);
      }
    });

    effect(() => {
      if (this.markAllResource.value() !== undefined) {
        this.manualReload.update(n => n + 1);
      }
    });

    effect(() => {
      const err = this.markReadResource.error();
      if (err) this.markReadTrigger.set(null);
    });
  }

  public toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
    if (this.isDropdownOpen()) {
      this.manualReload.update(n => n + 1);
    }
  }

  public closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  public markAsRead(notification: NotificationResponse): void {
    if (notification.isRead || this.markReadResource.isLoading()) return;

    this.markReadTrigger.set(notification.recipientId);

    if (notification.actionUrl) {
      this.isDropdownOpen.set(false);
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  public markAllAsRead(): void {
    if (this.markAllResource.isLoading()) return;
    this.markAllTrigger.update(n => n + 1);
  }

  public viewAll(): void {
    this.isDropdownOpen.set(false);
    this.router.navigate(['/dashboard/notifications']);
  }
}
