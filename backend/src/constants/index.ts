export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_CODES = {
  USER_NOT_FOUND: '401',
  INVALID_PASSWORD: '402',
  USER_INACTIVE: '403',
  EMAIL_EXISTS: '405',
  DNI_EXISTS: '406',
  RESOURCE_NOT_FOUND: '404',
  VALIDATION_ERROR: '422',
  INTERNAL_ERROR: '500',
} as const;

export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Usuario no encontrado',
  INVALID_PASSWORD: 'Credenciales inválidas',
  USER_INACTIVE: 'Usuario inactivo',
  EMAIL_EXISTS: 'El correo electrónico ya existe',
  DNI_EXISTS: 'El número de documento ya existe',
  RESOURCE_NOT_FOUND: 'Recurso no encontrado',
  VALIDATION_ERROR: 'Error de validación',
  INTERNAL_ERROR: 'Error interno del servidor',
  UNAUTHORIZED: 'Acceso no autorizado',
  FORBIDDEN: 'Acceso prohibido',
  NO_TOKEN: 'No hay token de acceso',
  INVALID_TOKEN: 'Token inválido o expirado',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  EXPIRES_IN: '24h',
  ALGORITHM: 'HS256',
} as const;

export const API_VERSION = 'v1';
export const API_PREFIX = '/api';