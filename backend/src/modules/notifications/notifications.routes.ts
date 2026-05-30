import { Router } from "express";
import * as NotificationsController from "./notifications.controller";
import { authenticateToken } from "../../middlewares/AuthMiddleware";

const router = Router();

router.get("/notifications", authenticateToken, NotificationsController.getNotifications);
router.get("/notifications/unread-count", authenticateToken, NotificationsController.getUnreadCount);
router.patch("/notifications/:id/read", authenticateToken, NotificationsController.markAsRead);
router.patch("/notifications/read-all", authenticateToken, NotificationsController.markAllAsRead);

export default router;
