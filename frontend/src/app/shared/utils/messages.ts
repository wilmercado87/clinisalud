export const formatMessage = (
  template: string,
  params: Record<string, string | number>,
): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    params[key] !== undefined ? String(params[key]) : match,
  );

export const APP_MESSAGES = {
  OPERATION_ERROR: 'Ocurrió un error en la operación',
} as const;

export const CATALOG_MESSAGES = {
  INVALID_OPTION: 'Ingreso no válido',
  REQUIRED_FIELD: 'Seleccione {field}',
  REQUIRED_DEFAULT: 'Seleccione un valor',
} as const;

export const ADMISSION_MESSAGES = {
  PATIENT_LOOKUP_ERROR: 'Error al buscar el paciente',
  PATIENT_LOOKUP_INVALID_INPUT: 'Seleccione tipo de documento e ingrese número',
  ACTIVE_ADMISSION_EXISTS:
    'El paciente ya tiene una admisión activa ({admissionNumber}). Debe egresarla para crear una nueva admisión',
  ACTIVE_ADMISSION_INFO: 'El paciente ya tiene una admisión activa',
  ADMISSION_CREATED: 'Admisión {admissionNumber} registrada correctamente',
  ADMISSION_CREATE_ERROR: 'Error al registrar admisión',
  REQUIRED_FIELDS: 'Complete los campos requeridos para registrar la admisión',
  ADMISSION_DISCHARGED: 'Admisión {admissionNumber} egresada correctamente',
  ADMISSION_DISCHARGE_ERROR: 'Error al egresar la admisión',
  ADMISSION_STATE_CHANGED: 'Admisión {admissionNumber} pasó a estado {state}',
  ADMISSION_STATE_CHANGE_ERROR: 'Error al cambiar el estado de la admisión',
  CENSUS_LOAD_ERROR: 'Error al cargar el censo hospitalario',
  CUPS_SEARCH_ERROR: 'Error al buscar CUPS',
} as const;

export const AUTH_MESSAGES = {
  DUPLICATE_AUTH_NUMBER: 'Número de autorización ya registrado en esta admisión',
  DUPLICATE_COMPOSITE_KEY: 'Ya existe autorización para este tipo, CUPS y tarifario',
} as const;

export const USER_MESSAGES = {
  USER_CREATED: '¡Usuario registrado con éxito!',
  PERMISSIONS_UPDATED: 'Permisos actualizados correctamente',
  TOGGLE_STATUS_ERROR: 'Error al cambiar estado',
  SYNC_SERVER_ERROR: 'Error al sincronizar datos del servidor',
} as const;

export const NOTIFICATION_MESSAGES = {
  MARKED_READ: 'Notificaciones marcadas como leídas',
  MARK_READ_ERROR: 'Error al marcar notificación',
  MARK_ALL_READ_ERROR: 'Error al marcar notificaciones',
} as const;
