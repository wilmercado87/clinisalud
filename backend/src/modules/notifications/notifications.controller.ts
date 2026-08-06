import { Response } from "express";
import { NotificationsService } from "./notifications.service";
import { AuthRequest } from "../../middlewares/AuthMiddleware";
import { getHttpCode } from "../../utils/StatusCodes";
import {
  ERROR_MESSAGES,
  ERROR_MESSAGES_NOTIFICATIONS,
  HTTP_STATUS,
} from "../../constants";

const notificationsService = new NotificationsService();

const handleError = (error: any, res: Response) => {
  const statusCode = getHttpCode(error);
  return res.status(statusCode).json({ message: error.message, ...(error.code && { code: error.code }) });
};

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.AUTH_USER_NOT_FOUND });
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
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.AUTH_USER_NOT_FOUND });
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
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.AUTH_USER_NOT_FOUND });
    }
    await notificationsService.markAsRead(recipientId, userId);
    res.status(HTTP_STATUS.OK).json({ message: ERROR_MESSAGES_NOTIFICATIONS.NOTIFICATION_MARKED_READ });
  } catch (error: any) {
    return handleError(error, res);
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: ERROR_MESSAGES.AUTH_USER_NOT_FOUND });
    }
    await notificationsService.markAllAsRead(userId);
    res.status(HTTP_STATUS.OK).json({ message: ERROR_MESSAGES_NOTIFICATIONS.NOTIFICATIONS_MARKED_READ });
  } catch (error: any) {
    return handleError(error, res);
  }
};
