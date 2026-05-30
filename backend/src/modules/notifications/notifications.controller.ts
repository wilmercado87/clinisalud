import { Response } from "express";
import { NotificationsService } from "./notifications.service";
import { AuthRequest } from "../../middlewares/AuthMiddleware";
import { getHttpCode } from "../../utils/StatusCodes";
import { HTTP_STATUS } from "../../constants";

const notificationsService = new NotificationsService();

const handleError = (error: any, res: Response) => {
  const statusCode = getHttpCode(error.message);
  return res.status(statusCode).json({ message: error.message });
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "User not found" });
    }
    const limit = Math.min(Number(req.query.limit) || 5, 50);
    const offset = Number(req.query.offset) || 0;
    const result = await notificationsService.findByUser(userId, limit, offset);
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    return handleError(error, res);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "User not found" });
    }
    const count = await notificationsService.getUnreadCount(userId);
    res.status(HTTP_STATUS.OK).json({ count });
  } catch (error: any) {
    return handleError(error, res);
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const recipientId = Number(req.params.id);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "User not found" });
    }
    await notificationsService.markAsRead(recipientId, userId);
    res.status(HTTP_STATUS.OK).json({ message: "Notificación marcada como leída" });
  } catch (error: any) {
    return handleError(error, res);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "User not found" });
    }
    await notificationsService.markAllAsRead(userId);
    res.status(HTTP_STATUS.OK).json({ message: "Todas las notificaciones marcadas como leídas" });
  } catch (error: any) {
    return handleError(error, res);
  }
};
