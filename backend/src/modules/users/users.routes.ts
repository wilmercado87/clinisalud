import { Router } from "express";
import * as UsersController from "./users.controller";
import { authenticateToken, requireRole } from "../../middlewares/AuthMiddleware";
import { validateBody, validateParams } from "../../middlewares/ValidationMiddleware";
import {
  createUserValidation,
  updatePermissionsValidation,
  toggleStatusValidation,
  idParamValidation,
} from "./users.validations";

const router = Router();

router.get("/roles", authenticateToken, UsersController.getRoles);
router.get('/roles/menus', authenticateToken, UsersController.getMenuOptions);

router.get("/users", authenticateToken, requireRole('ADMIN'), UsersController.getManageableUsers);
router.post(
  "/users",
  authenticateToken,
  requireRole('ADMIN'),
  validateBody(createUserValidation),
  UsersController.registerUser
);
router.patch(
  "/users/:id/permissions",
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(idParamValidation),
  validateBody(updatePermissionsValidation),
  UsersController.updatePermissions
);
router.patch(
  "/users/:id/toggle-status",
  authenticateToken,
  requireRole('ADMIN'),
  validateParams(toggleStatusValidation),
  UsersController.toggleStatus
);

export default router;
