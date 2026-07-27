import { HTTP_STATUS } from '../constants';
import { AppError } from '../middlewares/ErrorHandlerMiddleware';

export const getHttpCode = (error: AppError | any): number => {
  return error?.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
};