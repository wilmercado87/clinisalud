/**
 * Mapeo de códigos de error de negocio a códigos de estado HTTP
 */
export const STATUS_MAP: Record<string, number> = {
  '401': 401, // No autorizado / Email no existe
  '402': 401, // Password incorrecto
  '403': 403, // Usuario inactivo
  '405': 409, // Conflicto: Email ya existe
  '406': 409, // Conflicto: DNI ya existe
};

/**
 * Retorna el código HTTP correspondiente o 500 por defecto
 */
export const getHttpCode = (errorMsg: string): number => {
  return STATUS_MAP[errorMsg] || 500;
};