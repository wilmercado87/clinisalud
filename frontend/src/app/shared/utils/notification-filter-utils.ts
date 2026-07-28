import { signal, computed, effect, Signal } from '@angular/core';
import { NotificationUI, NotificationDetailUI } from '@features/dashboard/models/notification.model';
import { getNotificationTypeLabel } from '@shared/utils/mapper-utils';
import { formatNotificationDate } from '@shared/utils/date-utils';

const ALL_TEXT = 'all';

export interface NotificationFilterUtils {
  searchQuery: ReturnType<typeof signal<string>>;
  filterRole: ReturnType<typeof signal<string>>;
  filterStatus: ReturnType<typeof signal<string>>;
  filterType: ReturnType<typeof signal<string>>;
  dateFrom: ReturnType<typeof signal<Date | null>>;
  dateTo: ReturnType<typeof signal<Date | null>>;
  sortOrder: ReturnType<typeof signal<'newest' | 'oldest'>>;
  filteredNotifications: Signal<NotificationDetailUI[]>;
  hasActiveFilters: Signal<boolean>;
  uniqueRoles: Signal<string[]>;
  uniqueTypes: Signal<{ type: string; label: string }[]>;
  clearFilters: () => void;
  toggleSort: () => void;
}

export function createNotificationFilter(dataNotifications: Signal<NotificationUI[]>): NotificationFilterUtils {
  const searchQuery = signal('');
  const filterRole = signal<string>(ALL_TEXT);
  const filterStatus = signal<string>(ALL_TEXT);
  const filterType = signal<string>(ALL_TEXT);
  const dateFrom = signal<Date | null>(null);
  const dateTo = signal<Date | null>(null);
  const sortOrder = signal<'newest' | 'oldest'>('newest');

  effect(() => {
    const from = dateFrom();
    const to = dateTo();
    if (from && to && to < from) {
      dateTo.set(null);
    }
  });

  const uniqueRoles = computed<string[]>(() => {
    const items = dataNotifications();
    const rawRoles = items.map(n => n.actorRole);
    return Array.from(new Set(rawRoles)).sort(
      (a, b) => a.localeCompare(b)
    );
  });

  const uniqueTypes = computed<{ type: string; label: string }[]>(() => {
    const items = dataNotifications();
    const rawTypes = items.map(n => n.type);
    return Array.from(new Set(rawTypes)).map(type => ({
      type,
      label: getNotificationTypeLabel(type)
    }));
  });

  const filteredNotifications = computed<NotificationDetailUI[]>(() => {
    const items = dataNotifications();
    const filtered = items.filter(n => evaluateCriteria(n));
    const sorted = sortItems(filtered, sortOrder());
    return sorted.map(n => ({
      ...n,
      typeLabel: getNotificationTypeLabel(n.type),
      formattedDate: formatNotificationDate(n.createdAt),
    }));
  });

  const hasActiveFilters = computed<boolean>(() =>
    searchQuery() !== '' ||
    filterRole() !== ALL_TEXT ||
    filterStatus() !== ALL_TEXT ||
    filterType() !== ALL_TEXT ||
    dateFrom() !== null ||
    dateTo() !== null
  );

  function evaluateCriteria(n: NotificationUI): boolean {
    const query = searchQuery().toLowerCase().trim();
    const matchesSearch = !query || n.message.toLowerCase().includes(query);
    const matchesRole = filterRole() === ALL_TEXT || n.actorRole === filterRole();
    const matchesType = filterType() === ALL_TEXT || n.type === filterType();
    const matchesStatus = evaluateStatus(n, filterStatus());
    const matchesDates = evaluateDates(n);

    return matchesSearch && matchesRole && matchesType && matchesStatus && matchesDates;
  }

  function evaluateStatus(n: NotificationUI, status: string): boolean {
    if (status === ALL_TEXT) return true;
    return status === 'unread' ? n.isUnread : !n.isUnread;
  }

  function evaluateDates(n: NotificationUI): boolean {
    const from = dateFrom();
    const to = dateTo();
    const ts = n.createdAtDate.getTime();

    const matchesFrom = !from || ts >= from.getTime();
    const matchesTo = !to || ts <= (to.getTime() + 86400000);

    return matchesFrom && matchesTo;
  }

  function sortItems(list: NotificationUI[], order: 'newest' | 'oldest'): NotificationUI[] {
    return [...list].sort((a, b) => {
      const diff = a.createdAtDate.getTime() - b.createdAtDate.getTime();
      return order === 'newest' ? -diff : diff;
    });
  }

  function clearFilters(): void {
    searchQuery.set('');
    filterRole.set(ALL_TEXT);
    filterStatus.set(ALL_TEXT);
    filterType.set(ALL_TEXT);
    dateFrom.set(null);
    dateTo.set(null);
    sortOrder.set('newest');
  }

  function toggleSort(): void {
    sortOrder.update(c => (c === 'newest' ? 'oldest' : 'newest'));
  }

  return {
    searchQuery,
    filterRole,
    filterStatus,
    filterType,
    dateFrom,
    dateTo,
    sortOrder,
    filteredNotifications,
    hasActiveFilters,
    uniqueRoles,
    uniqueTypes,
    clearFilters,
    toggleSort,
  };
}
