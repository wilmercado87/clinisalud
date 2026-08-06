import { Response } from "express";
import { getHttpCode } from "./StatusCodes";
import { AppError } from "../middlewares/ErrorHandlerMiddleware";
import { logError } from "./Logger";

const getErrorCode = (error: unknown): string | undefined => {
  if (typeof error !== "object" || error === null) return undefined;
  const candidate = error as AppError;
  return typeof candidate.code === "string" ? candidate.code : undefined;
};

export const handleControllerError = (
  error: unknown,
  res: Response,
  context: string,
): void => {
  const statusCode = getHttpCode(error);
  const message = error instanceof Error ? error.message : "Error inesperado del servidor";
  if (statusCode >= 500) {
    logError(`Error en ${context}`, { error: message });
  }
  const code = getErrorCode(error);
  res.status(statusCode).json({ message, ...(code ? { code } : {}) });
};