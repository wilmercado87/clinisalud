import { HTTP_STATUS } from '../constants';

export const getHttpCode = (error: unknown): number => {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    const statusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof statusCode === 'number') return statusCode;
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
};