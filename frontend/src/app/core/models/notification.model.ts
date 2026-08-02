export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  recipientId: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface NotificationUI extends NotificationResponse {
  timeAgo: string;
  isUnread: boolean;
  createdAtDate: Date;
}

export interface NotificationDetailUI extends NotificationUI {
  typeLabel: string;
  formattedDate: string;
}

export interface NotificationsListData {
  notifications: NotificationUI[];
  isLoading: boolean;
  hasError: boolean;
  hasUnread: boolean;
  pageSize: number;
  currentPage: number;
}

export type NotificationsListEvent =
  | { type: 'markAsRead'; notification: NotificationResponse }
  | { type: 'markAllAsRead' }
  | { type: 'reload' }
  | { type: 'prevPage' }
  | { type: 'nextPage' };
