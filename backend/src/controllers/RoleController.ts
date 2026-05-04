import { Request, Response } from "express";
import { RoleService } from "../services/RoleService";
import { getHttpCode } from "../utils/statusCodes";

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
