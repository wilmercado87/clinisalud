import { NotificationResponse, NotificationUI } from '@core/models/notification.model';
import { formatRelativeTime } from '@shared/utils/date-utils';

export const NOTIFICATION_TYPES = {
  USER_CREATED: 'USER_CREATED',
  USER_TOGGLED: 'USER_TOGGLED',
  ADMISSION_CREATED: 'ADMISSION_CREATED',
  BILLING_COMPLETED: 'BILLING_COMPLETED',
  DIAGNOSIS_UPDATED: 'DIAGNOSIS_UPDATED',
  BILLING_CANCELLED: 'BILLING_CANCELLED',
  AUTHORIZATION_REQUESTED: 'AUTHORIZATION_REQUESTED',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export function getNotificationTypeLabel(type: string): string {
  const dictionaryLabels: Record<string, string> = {
    [NOTIFICATION_TYPES.USER_CREATED]: 'Usuario creado',
    [NOTIFICATION_TYPES.USER_TOGGLED]: 'Estado usuario',
    [NOTIFICATION_TYPES.ADMISSION_CREATED]: 'Admisión',
    [NOTIFICATION_TYPES.BILLING_COMPLETED]: 'Facturación',
    [NOTIFICATION_TYPES.DIAGNOSIS_UPDATED]: 'Diagnóstico',
    [NOTIFICATION_TYPES.BILLING_CANCELLED]: 'Factura anulada',
    [NOTIFICATION_TYPES.AUTHORIZATION_REQUESTED]: 'Autorización',
  };
  return dictionaryLabels[type] || type;
}

export function toNotificationUI(item: NotificationResponse): NotificationUI {
  return {
    ...item,
    timeAgo: formatRelativeTime(item.createdAt),
    isUnread: !item.isRead,
    createdAtDate: new Date(item.createdAt),
  };
}
