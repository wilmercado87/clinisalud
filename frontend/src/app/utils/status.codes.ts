export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  INVALID_PASSWORD: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 405,
  DNI_ALREADY_EXISTS: 406,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MAPPING: Record<number, string> = {
  [HTTP_STATUS.UNAUTHORIZED]: 'Credenciales inválidas. Revise su correo',
  [HTTP_STATUS.INVALID_PASSWORD]: 'Credenciales inválidas. Revise su contraseña',
  [HTTP_STATUS.FORBIDDEN]: 'El usuario se encuentra inactivo',
  [HTTP_STATUS.NOT_FOUND]: 'Servidor no encontrado',
  [HTTP_STATUS.EMAIL_ALREADY_EXISTS]: 'Email ya existe',
  [HTTP_STATUS.DNI_ALREADY_EXISTS]: 'DNI ya existe',
  [HTTP_STATUS.VALIDATION_ERROR]: 'Error de validación',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Error interno del servidor',
};