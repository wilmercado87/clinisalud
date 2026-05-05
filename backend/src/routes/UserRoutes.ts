import { Router } from "express";
import * as UserController from "../controllers/UserController";
import * as RoleController from "../controllers/RoleController";

const router = Router();

// Rutas para Roles
router.get("/roles", RoleController.getRoles);
router.get('/roles/menus', RoleController.getMenuOptions);

// Rutas para Usuarios
router.get("/users", UserController.getManageableUsers);
router.post("/users", UserController.registerUser);
router.patch("/users/:id/permissions", UserController.updatePermissions);
router.patch("/users/:id/toggle-status", UserController.toggleStatus);

export default router;