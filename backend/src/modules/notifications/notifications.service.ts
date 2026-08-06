import { Op } from "sequelize";
import Notificacion from "../../models/Notificacion";
import DestinatarioNotificacion from "../../models/DestinatarioNotificacion";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ERROR_MESSAGES, ROLE_CODES } from "../../constants";
import { emitNotification } from "../../socket/socket.gateway";
import {
  DispatchNotificationRequest,
  NotificationResponse,
  SocketNotificationPayload,
} from "./notifications.types";

export class NotificationsService {
  public async findByUser(
    userId: number,
    limit: number = 5,
    offset: number = 0,
  ): Promise<NotificationResponse[]> {
    const recipients = await DestinatarioNotificacion.findAll({
      where: { userId },
      include: [{ model: Notificacion, as: "notification" }],
      order: [[{ model: Notificacion, as: "notification" }, "createdAt", "DESC"]],
      limit,
      offset,
    });

    return recipients.map((r) => this.toNotificationResponse(r));
  }

  private toNotificationResponse(recipient: DestinatarioNotificacion): NotificationResponse {
    const notification = recipient.notification!;
    return {
      id: recipient.notificationId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actorId: notification.actorId,
      actorName: notification.actorName,
      actorRole: notification.actorRole,
      actionUrl: notification.actionUrl ?? null,
      actionLabel: notification.actionLabel ?? null,
      createdAt: notification.createdAt,
      isRead: recipient.isRead,
      readAt: recipient.readAt,
      recipientId: recipient.id,
    };
  }

  public async getUnreadCount(userId: number): Promise<number> {
    return await DestinatarioNotificacion.count({
      where: { userId, isRead: false },
    });
  }

  public async markAsRead(recipientId: number, userId: number): Promise<void> {
    if (!Number.isInteger(recipientId) || recipientId <= 0) {
      throw ApiError.notFound(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    const recipient = await DestinatarioNotificacion.findByPk(recipientId);
    if (!recipient) throw ApiError.notFound(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    if (recipient.userId !== userId) throw ApiError.forbidden(ERROR_MESSAGES.FORBIDDEN);

    recipient.isRead = true;
    recipient.readAt = new Date();
    await recipient.save();
  }

  public async markAllAsRead(userId: number): Promise<void> {
    await DestinatarioNotificacion.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } },
    );
  }

  public async createAndDispatch(payload: DispatchNotificationRequest): Promise<void> {
    const notification = await Notificacion.create({
      type: payload.type,
      title: payload.title,
      message: payload.message,
      actorId: payload.actorId,
      actorName: payload.actorName,
      actorRole: payload.actorRole,
      actionUrl: payload.actionUrl || null,
      actionLabel: payload.actionLabel || null,
    });

    const recipients = await this.createRecipients(notification.id, payload.actorId);
    for (const recipient of recipients) {
      emitNotification(recipient.userId, this.toSocketPayload(notification, recipient.id));
    }
  }

  private async createRecipients(
    notificationId: number,
    actorId: number,
  ): Promise<DestinatarioNotificacion[]> {
    const adminUsers = await Usuario.findAll({
      include: [{
        model: Rol,
        as: "roleData",
        where: { code: { [Op.in]: [ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN] } },
      }],
      where: { isActive: true, id: { [Op.ne]: actorId } },
    });

    const recipients = adminUsers.map((u) => ({
      notificationId,
      userId: u.id,
    }));

    if (recipients.length === 0) return [];
    return await DestinatarioNotificacion.bulkCreate(recipients);
  }

  private toSocketPayload(
    notification: Notificacion,
    recipientId: number,
  ): SocketNotificationPayload {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actorId: notification.actorId,
      actorName: notification.actorName,
      actorRole: notification.actorRole,
      actionUrl: notification.actionUrl ?? null,
      actionLabel: notification.actionLabel ?? null,
      createdAt: notification.createdAt.toISOString(),
      isRead: false,
      readAt: null,
      recipientId,
    };
  }
}
