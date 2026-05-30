export interface NotificationItem {
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
