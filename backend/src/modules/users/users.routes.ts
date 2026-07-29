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
router.get('/menu-options', authenticateToken, UsersController.getMenuOptions);

const adminOrSuperAdmin = requireRole('ADMIN', 'SUPER_ADMIN');

router.get("/users", authenticateToken, adminOrSuperAdmin, UsersController.getManageableUsers);
router.post(
  "/users",
  authenticateToken,
  adminOrSuperAdmin,
  validateBody(createUserValidation),
  UsersController.registerUser
);
router.patch(
  "/users/:id/permissions",
  authenticateToken,
  adminOrSuperAdmin,
  validateParams(idParamValidation),
  validateBody(updatePermissionsValidation),
  UsersController.updatePermissions
);
router.post(
  "/users/:id/toggle-status",
  authenticateToken,
  adminOrSuperAdmin,
  validateParams(toggleStatusValidation),
  UsersController.toggleStatus
);

export default router;
