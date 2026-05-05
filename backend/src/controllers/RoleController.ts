import { Request, Response } from "express";
import { RoleService } from "../services/RoleService";
import { getHttpCode } from "../utils/StatusCodes";
import { HTTP_STATUS } from "../constants";

const roleService = new RoleService();

const handleError = (error: any, res: Response, context: string) => {
  const statusCode = getHttpCode(error.message);
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error(`🔥 Error ${context}:`, error);
  }
  return res.status(statusCode).json({ message: error.message });
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await roleService.findAllRoles();
    res.status(HTTP_STATUS.OK).json(roles);
  } catch (error: any) {
    return handleError(error, res, 'getRoles');
  }
};

export const getMenuOptions = async (req: Request, res: Response) => {
  try {
    const menus = await roleService.findAllMenuOptions();
    res.status(HTTP_STATUS.OK).json(menus);
  } catch (error: any) {
    return handleError(error, res, 'getMenuOptions');
  }
};