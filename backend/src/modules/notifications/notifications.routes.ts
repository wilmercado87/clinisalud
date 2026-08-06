import { Router } from "express";
import * as NotificationsController from "./notifications.controller";
import { authenticateToken } from "../../middlewares/AuthMiddleware";
import { validateParams } from "../../middlewares/ValidationMiddleware";
import { notificationIdParamValidation } from "./notifications.validations";

const router = Router();

router.get("/notifications", authenticateToken, NotificationsController.getNotifications);
router.get("/notifications/unread-count", authenticateToken, NotificationsController.getUnreadCount);
router.post(
  "/notifications/:id/read",
  authenticateToken,
  validateParams(notificationIdParamValidation),
  NotificationsController.markAsRead,
);
router.post("/notifications/read-all", authenticateToken, NotificationsController.markAllAsRead);

export default router;
