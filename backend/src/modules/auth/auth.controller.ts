import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { getHttpCode } from "../../utils/StatusCodes";
import { HTTP_STATUS } from "../../constants";
import { logInfo, logError } from "../../utils/Logger";
import { AuthRequest } from "../../middlewares/AuthMiddleware";

const authService = new AuthService();

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: "Email and password are required" });
    }

    logInfo(`Login attempt for email: ${email}`);
    const { user, menu, token } = await authService.login(email, password);
    logInfo(`User logged in successfully: ${email}`);

    return res.json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dni: user.dni,
        phone: user.phone,
        address: user.address,
        role: user.role,
        roleId: user.roleId,
        isActive: user.isActive,
        documentTypeId: user.documentTypeId,
        roleData: user.roleData,
      },
      menu,
    });
  } catch (error: any) {
    logError(`Login failed for email: ${req.body.email}`, { error: error.message });
    const statusCode = getHttpCode(error);
    const message = error.message;
    return res.status(statusCode).json({ message, ...(error.code && { code: error.code }) });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { email, firstName, lastName, phone, address } = req.body;
    const result = await authService.updateProfile(userId, { email, firstName, lastName, phone, address });
    logInfo(`Profile updated for user ID: ${userId}`);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    logError(`Profile update failed`, { error: error.message });
    const statusCode = getHttpCode(error);
    const message = error.message;
    return res.status(statusCode).json({ message, ...(error.code && { code: error.code }) });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    logError(`Password recovery failed for email: ${req.body.email}`, { error: error.message });
    const statusCode = getHttpCode(error);
    const message = error.message;
    return res.status(statusCode).json({ message, ...(error.code && { code: error.code }) });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(userId, { currentPassword, newPassword });
    logInfo(`Password changed for user ID: ${userId}`);
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    logError(`Password change failed`, { error: error.message });
    const statusCode = getHttpCode(error);
    const message = error.message;
    return res.status(statusCode).json({ message, ...(error.code && { code: error.code }) });
  }
}
