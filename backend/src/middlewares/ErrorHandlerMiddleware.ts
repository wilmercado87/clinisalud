import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  console.error(`[ERROR] ${err.message}`, {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const response: any = {
    success: false,
    message: err.message,
  };

  if (err.code) {
    response.code = err.code;
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(statusCode).json(response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
  });
};

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message?: string) {
    const msg = message || ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    return new ApiError(msg, HTTP_STATUS.NOT_FOUND, 'RESOURCE_NOT_FOUND');
  }

  static unauthorized(message?: string) {
    const msg = message || ERROR_MESSAGES.UNAUTHORIZED;
    return new ApiError(msg, HTTP_STATUS.UNAUTHORIZED, 'USER_NOT_FOUND');
  }

  static forbidden(message?: string) {
    const msg = message || ERROR_MESSAGES.FORBIDDEN;
    return new ApiError(msg, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }

  static badRequest(message: string) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST');
  }

  static conflict(message: string, errorCode = 'DNI_EXISTS') {
    return new ApiError(message, HTTP_STATUS.CONFLICT, errorCode);
  }

  static emailExists(message = ERROR_MESSAGES.EMAIL_EXISTS) {
    return new ApiError(message, HTTP_STATUS.CONFLICT, 'EMAIL_EXISTS');
  }

  static internal(message?: string) {
    const msg = message || ERROR_MESSAGES.INTERNAL_ERROR;
    return new ApiError(msg, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
  }
}