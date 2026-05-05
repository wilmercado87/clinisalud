import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from '../constants';
import { getHttpCode } from '../utils/StatusCodes';

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
  const statusCode = err.statusCode || getHttpCode(err.message);
  const errorMessage = err.message.split(':')[1] || err.message;

  console.error(`[ERROR] ${err.message}`, {
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const response: any = {
    success: false,
    message: errorMessage,
  };

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

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message?: string) {
    const msg = message || ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    return new ApiError(`${ERROR_CODES.RESOURCE_NOT_FOUND}:${msg}`, HTTP_STATUS.NOT_FOUND);
  }

  static unauthorized(message?: string) {
    const msg = message || ERROR_MESSAGES.UNAUTHORIZED;
    return new ApiError(`${ERROR_CODES.USER_NOT_FOUND}:${msg}`, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(message?: string) {
    const msg = message || ERROR_MESSAGES.FORBIDDEN;
    return new ApiError(`${ERROR_CODES.FORBIDDEN}:${msg}`, HTTP_STATUS.FORBIDDEN);
  }

  static badRequest(message: string) {
    return new ApiError(message, HTTP_STATUS.BAD_REQUEST);
  }

  static conflict(message: string, code: keyof typeof ERROR_CODES = 'DNI_EXISTS') {
    return new ApiError(`${ERROR_CODES[code]}:${message}`, HTTP_STATUS.CONFLICT);
  }

  static emailExists(message = ERROR_MESSAGES.EMAIL_EXISTS) {
    return new ApiError(`${ERROR_CODES.EMAIL_EXISTS}:${message}`, HTTP_STATUS.CONFLICT);
  }

  static internal(message?: string) {
    const msg = message || ERROR_MESSAGES.INTERNAL_ERROR;
    return new ApiError(`${ERROR_CODES.INTERNAL_ERROR}:${msg}`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}