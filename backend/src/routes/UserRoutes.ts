import { Router } from "express";
import * as UserController from "../controllers/UserController";
import * as RoleController from "../controllers/RoleController";
import { authenticateToken, requireRole } from "../middlewares/AuthMiddleware";

const router = Router();

router.get("/roles", authenticateToken, RoleController.getRoles);
router.get('/roles/menus', authenticateToken, RoleController.getMenuOptions);

router.get("/users", authenticateToken, requireRole('ADMIN'), UserController.getManageableUsers);
router.post("/users", authenticateToken, requireRole('ADMIN'), UserController.registerUser);
router.patch("/users/:id/permissions", authenticateToken, requireRole('ADMIN'), UserController.updatePermissions);
router.patch("/users/:id/toggle-status", authenticateToken, requireRole('ADMIN'), UserController.toggleStatus);

export default router;