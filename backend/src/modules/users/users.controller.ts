import { Request, Response } from "express";
import { UsersService } from "./users.service";
import { getHttpCode } from "../../utils/StatusCodes";
import { HTTP_STATUS } from "../../constants";

const usersService = new UsersService();

const handleError = (error: any, res: Response, context: string) => {
  const statusCode = getHttpCode(error.message);
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error(`🔥 Error ${context}:`, error);
  }
  return res.status(statusCode).json({ message: error.message });
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await usersService.findAllRoles();
    res.status(HTTP_STATUS.OK).json(roles);
  } catch (error: any) {
    return handleError(error, res, 'getRoles');
  }
};

export const getMenuOptions = async (req: Request, res: Response) => {
  try {
    const menus = await usersService.findAllMenuOptions();
    res.status(HTTP_STATUS.OK).json(menus);
  } catch (error: any) {
    return handleError(error, res, 'getMenuOptions');
  }
};

export const getManageableUsers = async (req: Request, res: Response) => {
  try {
    const users = await usersService.findAllManageableUsers();
    res.status(HTTP_STATUS.OK).json(users);
  } catch (error: any) {
    return handleError(error, res, 'getManageableUsers');
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const result = await usersService.createUser(req.body);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: any) {
    return handleError(error, res, 'registerUser');
  }
};

export const updatePermissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    const result = await usersService.updateUserPermissions(Number(id), permissions);
    res.status(HTTP_STATUS.OK).json({
      message: "Permisos actualizados correctamente",
      data: result,
    });
  } catch (error: any) {
    return handleError(error, res, 'updatePermissions');
  }
};

export const toggleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await usersService.toggleUserStatus(Number(id));
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    return handleError(error, res, 'toggleStatus');
  }
};
