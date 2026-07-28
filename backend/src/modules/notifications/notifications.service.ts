import { Op } from "sequelize";
import Notificacion from "../../models/Notificacion";
import DestinatarioNotificacion from "../../models/DestinatarioNotificacion";
import Usuario from "../../models/Usuario";
import Rol from "../../models/Rol";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ERROR_MESSAGES } from "../../constants";
import { emitNotification } from "../../socket/socket.gateway";

export class NotificationsService {
  public async findByUser(
    userId: number,
    limit: number = 5,
    offset: number = 0,
  ) {
    const recipients = await DestinatarioNotificacion.findAll({
      where: { userId },
      include: [{ model: Notificacion, as: "notification" }],
      order: [[{ model: Notificacion, as: "notification" }, "createdAt", "DESC"]],
      limit,
      offset,
    });

    return recipients.map(r => ({
      id: r.notificationId,
      type: (r as any).notification.type,
      title: (r as any).notification.title,
      message: (r as any).notification.message,
      actorId: (r as any).notification.actorId,
      actorName: (r as any).notification.actorName,
      actorRole: (r as any).notification.actorRole,
      actionUrl: (r as any).notification.actionUrl,
      actionLabel: (r as any).notification.actionLabel,
      createdAt: (r as any).notification.createdAt,
      isRead: r.isRead,
      readAt: r.readAt,
      recipientId: r.id,
    }));
  }

  public async getUnreadCount(userId: number): Promise<number> {
    return await DestinatarioNotificacion.count({
      where: { userId, isRead: false },
    });
  }

  public async markAsRead(recipientId: number, userId: number) {
    const recipient = await DestinatarioNotificacion.findByPk(recipientId);
    if (!recipient) throw ApiError.notFound(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    if (recipient.userId !== userId) throw ApiError.forbidden(ERROR_MESSAGES.FORBIDDEN);

    recipient.isRead = true;
    recipient.readAt = new Date();
    await recipient.save();
  }

  public async markAllAsRead(userId: number) {
    await DestinatarioNotificacion.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } },
    );
  }

  public async createAndDispatch(
    type: string,
    title: string,
    message: string,
    actorId: number,
    actorName: string,
    actorRole: string,
    actionUrl?: string | null,
    actionLabel?: string | null,
  ) {
    const notification = await Notificacion.create({
      type,
      title,
      message,
      actorId,
      actorName,
      actorRole,
      actionUrl: actionUrl || null,
      actionLabel: actionLabel || null,
    });

    const adminUsers = await Usuario.findAll({
      include: [{
        model: Rol,
        as: "roleData",
        where: { code: { [Op.in]: ["SUPER_ADMIN", "ADMIN"] } },
      }],
      where: { isActive: true, id: { [Op.ne]: actorId } },
    });

    const recipients = adminUsers.map(u => ({
      notificationId: notification.id,
      userId: u.id,
    }));

    let createdRecipients: DestinatarioNotificacion[] = [];
    if (recipients.length > 0) {
      createdRecipients = await DestinatarioNotificacion.bulkCreate(recipients);
    }

    for (const rec of createdRecipients) {
      emitNotification(rec.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actorId: notification.actorId,
        actorName: notification.actorName,
        actorRole: notification.actorRole,
        actionUrl: notification.actionUrl,
        actionLabel: notification.actionLabel,
        createdAt: notification.createdAt.toISOString(),
        isRead: false,
        readAt: null,
        recipientId: rec.id,
      });
    }
  }
}
