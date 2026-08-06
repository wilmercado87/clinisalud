import { NotificationsService } from "../modules/notifications/notifications.service";
import { formatMessage } from "./formatMessage";
import { AdmissionNotificationConfig, UserNotificationConfig } from "../constants";

export type NotificationConfig = AdmissionNotificationConfig | UserNotificationConfig;

export interface NotificationActor {
  id: number;
  name: string;
  role: string;
}

export const dispatchNotification = (
  notificationsService: NotificationsService,
  config: NotificationConfig,
  actor: NotificationActor,
  messageParams: Record<string, string | number>,
  titleParams?: Record<string, string | number>,
): void => {
  notificationsService
    .createAndDispatch({
      type: config.type,
      title: titleParams ? formatMessage(config.title, titleParams) : config.title,
      message: formatMessage(config.messageTemplate, messageParams),
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      actionUrl: config.actionUrl,
      actionLabel: config.actionLabel,
    })
    .catch(() => {});
};