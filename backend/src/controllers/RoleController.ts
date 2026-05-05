import { Request, Response } from "express";
import { RoleService } from "../services/RoleService";
import { getHttpCode } from "../utils/StatusCodes";

const roleService = new RoleService();

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await roleService.findAllRoles();
    res.status(200).json(roles);
  } catch (error: any) {
    const statusCode = getHttpCode(error.message);
    if (statusCode === 500) console.error("🔥 Error getRoles:", error);

    return res.status(statusCode).json({ message: error.message });
  }
};

export const getMenuOptions = async (req: Request, res: Response) => {
  try {
    const menus = await roleService.findAllMenuOptions();
    res.json(menus);
  } catch (error) {
    console.error("Error al obtener catálogo de menús:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
