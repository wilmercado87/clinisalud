import { Component, input, output, signal, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../shared/material/material.module';
import { NotificationItem } from '../../../../models/notification.model';
import { formatNotificationDate } from '../../../../core/utils/date-utils';
import { getNotificationTypeLabel } from '../../../../core/utils/mapper-utils';

export interface NotificationVM extends NotificationItem {
  timeAgo: string;
  isUnread: boolean;
  createdAtDate: Date;
}

export interface NotificationUI extends NotificationVM {
  typeLabel: string;
  formattedDate: string;
}

export interface NotificationsListData {
  notifications: NotificationVM[];
  isLoading: boolean;
  hasError: boolean;
  hasUnread: boolean;
  pageSize: number;
  currentPage: number;
}

export type NotificationsListEvent =
  | { type: 'markAsRead'; notification: NotificationItem }
  | { type: 'markAllAsRead' }
  | { type: 'reload' }
  | { type: 'prevPage' }
  | { type: 'nextPage' };

@Component({
  selector: 'app-notification-filtered-list',
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './notification-filtered-list.component.html',
  styleUrls: ['./notification-filtered-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationFilteredListComponent {
  public readonly ALL_TEXT = 'all';
  public readonly data = input.required<NotificationsListData>();
  public readonly event = output<NotificationsListEvent>();

  public readonly searchQuery = signal('');
  public readonly filterRole = signal<string>(this.ALL_TEXT);
  public readonly filterStatus = signal<string>(this.ALL_TEXT);
  public readonly filterType = signal<string>(this.ALL_TEXT);
  public readonly dateFrom = signal<Date | null>(null);
  public readonly dateTo = signal<Date | null>(null);
  public readonly sortOrder = signal<'newest' | 'oldest'>('newest');

  constructor() {
    effect(() => {
      const from = this.dateFrom();
      const to = this.dateTo();
      if (from && to && to < from) {
        this.dateTo.set(null);
      }
    });
  }

  public readonly uniqueRoles = computed<string[]>(() => {
    const rawRoles = this.data().notifications.map(n => n.actorRole);
    return Array.from(new Set(rawRoles)).sort(
      (firstRole, secondRole) => firstRole.localeCompare(secondRole)
    );
  });

  public readonly uniqueTypes = computed<{ type: string; label: string }[]>(() => {
    const rawTypes = this.data().notifications.map(n => n.type);
    return Array.from(new Set(rawTypes)).map(type => ({
      type,
      label: getNotificationTypeLabel(type)
    }));
  });

  public readonly filteredNotifications = computed<NotificationUI[]>(() => {
    const rawNotifications = this.data().notifications;

    const filtered = rawNotifications.filter(notification => 
      this.evaluateNotificationCriteria(notification)
    );

    const sorted = this.sortNotifications(filtered, this.sortOrder());

    return sorted.map(notification => ({
      ...notification,
      typeLabel: getNotificationTypeLabel(notification.type),
      formattedDate: formatNotificationDate(notification.createdAt)
    }));
  });

  public readonly hasActiveFilters = computed<boolean>(() =>
    this.searchQuery() !== '' ||
    this.filterRole() !== this.ALL_TEXT ||
    this.filterStatus() !== this.ALL_TEXT ||
    this.filterType() !== this.ALL_TEXT ||
    this.dateFrom() !== null ||
    this.dateTo() !== null
  );

  private evaluateNotificationCriteria(notification: NotificationVM): boolean {
    const searchPhrase = this.searchQuery().toLowerCase().trim();

    const matchesSearch = !searchPhrase || notification.message.toLowerCase().includes(searchPhrase);
    const matchesRole = this.filterRole() === this.ALL_TEXT || notification.actorRole === this.filterRole();
    const matchesType = this.filterType() === this.ALL_TEXT || notification.type === this.filterType();
    const matchesStatus = this.evaluateStatusCriteria(notification, this.filterStatus());
    const matchesDates = this.evaluateDateCriteria(notification);

    return matchesSearch && matchesRole && matchesType && matchesStatus && matchesDates;
  }

  private evaluateStatusCriteria(notification: NotificationVM, statusFilter: string): boolean {
    if (statusFilter === this.ALL_TEXT) return true;
    return statusFilter === 'unread' ? notification.isUnread : !notification.isUnread;
  }

  private evaluateDateCriteria(notification: NotificationVM): boolean {
    const startDateLimit = this.dateFrom();
    const endDateLimit = this.dateTo();
    const notificationTimestamp = notification.createdAtDate.getTime();

    const matchesStartDate = !startDateLimit ||
      notificationTimestamp >= startDateLimit.getTime();
    const matchesEndDate = !endDateLimit || 
      notificationTimestamp <= (endDateLimit.getTime() + 86400000);

    return matchesStartDate && matchesEndDate;
  }

  private sortNotifications(list: NotificationVM[], order: 'newest' | 'oldest'): NotificationVM[] {
    return [...list].sort((a, b) => {
      const difference = a.createdAtDate.getTime() - b.createdAtDate.getTime();
      return order === 'newest' ? -difference : difference;
    });
  }

  public clearFilters(): void {
    this.searchQuery.set('');
    this.filterRole.set(this.ALL_TEXT);
    this.filterStatus.set(this.ALL_TEXT);
    this.filterType.set(this.ALL_TEXT);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.sortOrder.set('newest');
  }

  public toggleSort(): void {
    this.sortOrder.update(current => (current === 'newest' ? 'oldest' : 'newest'));
  }

  public onCardClick(targetNotification: NotificationItem): void {
    this.event.emit({ type: 'markAsRead', notification: targetNotification });
  }
}