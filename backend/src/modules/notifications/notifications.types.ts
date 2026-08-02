export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
  isRead: boolean;
  readAt: Date | null;
  recipientId: number;
}

export interface DispatchNotificationRequest {
  type: string;
  title: string;
  message: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
}

export interface SocketNotificationPayload {
  id: number;
  type: string;
  title: string;
  message: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: null;
  recipientId: number;
}
