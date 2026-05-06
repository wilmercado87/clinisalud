import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { getHttpCode } from "../utils/StatusCodes";
import { HTTP_STATUS } from "../constants";
import { logInfo, logError } from "../utils/Logger";

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
        role: user.roleData?.code,
      },
      menu,
    });
  } catch (error: any) {
    logError(`Login failed for email: ${req.body.email}`, { error: error.message });
    const statusCode = getHttpCode(error.message);
    return res.status(statusCode).json({ message: error.message });
  }
}