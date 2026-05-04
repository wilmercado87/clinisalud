import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { getHttpCode } from "../utils/StatusCodes";

const userService = new UserService();

export const getManageableUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.findAllManageableUsers();
    res.status(200).json(users);
  } catch (error: any) {
    const statusCode = getHttpCode(error.message);
    if (statusCode === 500) console.error("🔥 Error getManageableUsers:", error);

    return res.status(statusCode).json({ message: error.message });
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await userService.createUser(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    const statusCode = getHttpCode(error.message);
    if (statusCode === 500) console.error("🔥 Error registerUser:", error);

    return res.status(statusCode).json({ message: error.message });
  }
};

export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    const result = await userService.updateUserPermissions(
      Number(id),
      permissions,
    );
    res.status(200).json({
      message: "Permisos actualizados correctamente",
      data: result,
    });
  } catch (error: any) {
    const statusCode = getHttpCode(error.message);
    if (statusCode === 500) console.error("🔥 Error updatePermissions:", error);

    return res.status(statusCode).json({ message: error.message });
  }
};

export const toggleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await userService.toggleUserStatus(Number(id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: "Error al cambiar el estado del usuario",
      error: error.message,
    });
  }
};
