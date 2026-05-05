import { HTTP_STATUS } from '../constants';

export const STATUS_MAP: Record<string, number> = {
  '401': HTTP_STATUS.UNAUTHORIZED,
  '402': HTTP_STATUS.UNAUTHORIZED,
  '403': HTTP_STATUS.FORBIDDEN,
  '404': HTTP_STATUS.NOT_FOUND,
  '405': HTTP_STATUS.CONFLICT,
  '406': HTTP_STATUS.CONFLICT,
  '409': HTTP_STATUS.CONFLICT,
  '422': HTTP_STATUS.UNPROCESSABLE_ENTITY,
  '500': HTTP_STATUS.INTERNAL_SERVER_ERROR,
};

export const getHttpCode = (errorMsg: string): number => {
  const code = errorMsg.split(':')[0];
  return STATUS_MAP[code] || HTTP_STATUS.INTERNAL_SERVER_ERROR;
};