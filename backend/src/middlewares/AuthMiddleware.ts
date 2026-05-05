import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_MESSAGES, JWT_CONFIG } from '../constants';
import { ApiError } from './ErrorHandlerMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'clinisalud_secret';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.NO_TOKEN,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as jwt.JwtPayload;

    if (!decoded.id || !decoded.role) {
      throw ApiError.unauthorized("Token inválido");
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email || '',
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Token expirado",
      });
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_TOKEN,
      });
    }

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.FORBIDDEN,
      });
    }

    next();
  };
};