export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INVALID_PASSWORD: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_ALREADY_EXISTS: 405,
  DNI_ALREADY_EXISTS: 406,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
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
  TOKEN_EXPIRED: 'Token expirado',
  EMAIL_PASSWORD_REQUIRED: 'Email y contraseña son requeridos',
  AUTH_USER_NOT_FOUND: 'Usuario no encontrado',
  RATE_LIMIT_TOO_MANY: 'Demasiadas solicitudes, intente más tarde',
  RATE_LIMIT_LOGIN: 'Demasiados intentos de login, intente en 15 minutos',
  ROUTE_NOT_FOUND: 'Ruta no encontrada: {url}',
  CREATE_ADMIN_FORBIDDEN: 'No tienes permisos para crear usuarios administradores',
  PERMISSIONS_SUPER_ADMIN_FORBIDDEN: 'No se puede cambiar permisos del super administrador',
  PERMISSIONS_ADMIN_FORBIDDEN: 'No se puede cambiar permisos de administrador',
  STATUS_SUPER_ADMIN_FORBIDDEN: 'No se puede cambiar estado del super administrador',
  STATUS_ADMIN_FORBIDDEN: 'No se puede cambiar estado de administrador',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
} as const;

export const JWT_CONFIG = {
  EXPIRES_IN: '24h',
  ALGORITHM: 'HS256',
  SECRET_FALLBACK: 'clinisalud_secret',
} as const;

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  ADMISIONES: 'ADMISIONES',
  MEDICO: 'MEDICO',
  FACTURADOR: 'FACTURADOR',
} as const;

export const MENU_LABELS = {
  GESTOR_USUARIOS: 'GESTOR USUARIOS',
} as const;

export const OPERATIONAL_ROLES: readonly string[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.ADMISIONES,
  ROLE_CODES.MEDICO,
  ROLE_CODES.FACTURADOR,
] as const;

export const ADMIN_ROLES: readonly string[] = [
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
] as const;

export const PATIENT_STATUS = {
  ACTIVE: 'ACTIVO',
  INACTIVE: 'INACTIVO',
} as const;

export const ADMISSION_STATUS = {
  REGISTERED: 'REGISTRADA',
  IN_CARE: 'EN_ATENCION',
  WITH_EPICRISIS: 'CON_EPICRISIS',
  BILLED: 'FACTURADA',
  DISCHARGED: 'EGRESADA',
} as const;

export const BED_STATUS = {
  AVAILABLE: 0,
  OCCUPIED: 1,
} as const;

export const ERROR_MESSAGES_AUTH = {
  USER_NOT_FOUND: ERROR_MESSAGES.USER_NOT_FOUND,
  INVALID_PASSWORD: ERROR_MESSAGES.INVALID_PASSWORD,
  USER_INACTIVE: ERROR_MESSAGES.USER_INACTIVE,
  CURRENT_PASSWORD_INCORRECT: 'La contraseña actual no es correcta',
  NEW_PASSWORD_MUST_DIFFER: 'La nueva contraseña debe ser diferente a la actual',
  PASSWORD_UPDATED: 'Contraseña actualizada correctamente',
  FORGOT_PASSWORD_RESPONSE: 'Si el correo existe, recibirás una contraseña temporal para iniciar sesión',
  EMAIL_VALID: 'El correo electrónico debe ser válido',
  PASSWORD_REQUIRED: 'La contraseña es requerida',
  FIRST_NAME_LENGTH: 'El nombre debe tener entre 1 y 100 caracteres',
  LAST_NAME_LENGTH: 'El apellido debe tener entre 1 y 100 caracteres',
  PHONE_LENGTH: 'El teléfono debe tener entre 7 y 15 dígitos',
  ADDRESS_MAX: 'La dirección debe tener máximo 255 caracteres',
  CURRENT_PASSWORD_REQUIRED: 'La contraseña actual es requerida',
  NEW_PASSWORD_PATTERN: 'La nueva contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y un carácter especial',
} as const;

export const ERROR_MESSAGES_ADMISION = {
  PATIENT_NOT_FOUND: 'Paciente no encontrado',
  PATIENT_NOT_FOUND_WITH_DATA: 'Paciente no encontrado con los datos proporcionados',
  PATIENT_ALREADY_EXISTS: 'Ya existe un paciente con ese tipo y número de documento',
  FIRST_NAME_REQUIRED: 'Nombre del paciente es requerido',
  LAST_NAME_REQUIRED: 'Apellido del paciente es requerido',
  ACTIVE_ADMISSION_EXISTS: 'El paciente ya tiene una admisión activa ({admissionNumber}). Debe egresarla para crear una nueva admisión',
  BED_NOT_FOUND: 'Cama no encontrada',
  BED_UNAVAILABLE: 'La cama seleccionada no está disponible',
  BED_NOT_OCCUPIED: 'La cama no se encuentra ocupada',
  EPS_NOT_FOUND: 'EPS no encontrada',
  ADMISSION_NOT_FOUND: 'Admisión no encontrada',
  ADMISSION_ALREADY_DISCHARGED: 'La admisión ya fue egresada',
  DOCUMENT_TYPE_VALID: 'Tipo de documento debe ser un número válido',
  DOCUMENT_REQUIRED_MAX: 'Documento es requerido y debe tener máximo 30 caracteres',
  IS_NEW_PATIENT_BOOLEAN: 'isNewPatient debe ser booleano',
  DOCUMENT_TYPE_REQUIRED: 'Tipo de documento es requerido',
  DOCUMENT_REQUIRED: 'Documento es requerido',
  EPS_REQUIRED: 'EPS es requerida',
  BED_REQUIRED: 'Cama es requerida',
  OBSERVATIONS_INVALID: 'Observaciones deben ser texto',
  COMPANION_OBJECT: 'Acompañante debe ser un objeto',
  COMPANION_FIRST_NAME_INVALID: 'Nombre del acompañante inválido',
  COMPANION_LAST_NAME_INVALID: 'Apellido del acompañante inválido',
  COMPANION_DOCUMENT_TYPE_INVALID: 'Tipo de documento del acompañante inválido',
  COMPANION_DOCUMENT_INVALID: 'Documento del acompañante inválido',
  COMPANION_ADDRESS_INVALID: 'Dirección del acompañante inválida',
  COMPANION_RELATIONSHIP_INVALID: 'Parentesco del acompañante inválido',
  COMPANION_PHONE_INVALID: 'Teléfono del acompañante inválido',
  AUTHORIZATIONS_ARRAY: 'Autorizaciones debe ser un arreglo',
  AUTH_TYPE_REQUIRED: 'Tipo de autorización es requerido',
  AUTH_NUMBER_REQUIRED: 'Número de autorización es requerido',
  AUTH_MAPIISS_REQUIRED: 'Código MAPIISS es requerido',
  AUTH_QUANTITY_MIN: 'Cantidad debe ser mayor o igual a 1',
  ADMISSION_NUMBER_REQUIRED: 'Número de admisión es requerido',
  ADMISSION_NUMBER_COLLISION: 'No se pudo generar el número de admisión, intente nuevamente',
  AUTH_MAPIISS_NOT_FOUND: 'El código MAPIISS {mapiissCode} no existe en el tarifario',
  AUTH_TYPE_NOT_FOUND: 'El tipo de autorización no es válido',
  AUTH_FEE_SCHEDULE_REQUIRED: 'Tarifario es requerido para la autorización',
  AUTH_FEE_SCHEDULE_MISMATCH: 'El tarifario no coincide con el CUPS seleccionado',
  AUTH_QUANTITY_EXCEEDS_MAX: 'La cantidad excede el máximo permitido ({maxQuantity}) para el servicio',
  AUTH_QUANTITY_EXCEEDS_MAPIISS_MAX:
    'La cantidad autorizada de este MAPIISS supera la cantidad de procedimientos por paciente',
  AUTH_ALREADY_EXISTS: 'La autorización ya existe para esta admisión',
  ADMISSION_STATE_REQUIRED: 'El estado de la admisión es requerido',
  ADMISSION_STATE_INVALID: 'El estado no es válido',
  ADMISSION_STATE_UNCHANGED: 'La admisión ya se encuentra en el estado {state}',
  INVALID_STATE_TRANSITION: 'Transición de estado no permitida: de {currentState} a {nextState}',
  BILLING_SERVICE_NOT_FOUND: 'El servicio {mapiissCode} no existe en el tarifario',
  BILLING_SERVICE_NO_AUTH: 'Servicio {mapiissCode} bloqueado para facturación: requiere autorización previa no registrada',
  BILLING_AUTH_INSUFFICIENT_QUANTITY: 'La cantidad autorizada ({authorized}) es insuficiente para cobrar {requested} del servicio {mapiissCode}',
  BILLABILITY_MODALITY_INVALID: 'La modalidad debe ser AMBULATORIO u HOSPITALIZACION',
  BILLABILITY_ITEMS_REQUIRED: 'Debe enviar al menos un servicio a validar',
} as const;

export const ADMISSION_MODALITY = {
  AMBULATORY: 'AMBULATORIO',
  HOSPITALIZATION: 'HOSPITALIZACION',
  authFieldOf: (modality: string): "authAmb" | "authHosp" =>
    modality === ADMISSION_MODALITY.HOSPITALIZATION ? "authHosp" : "authAmb",
} as const;

export const ADMISSION_STATE_MACHINE: Record<string, readonly string[]> = {
  [ADMISSION_STATUS.REGISTERED]: [ADMISSION_STATUS.IN_CARE],
  [ADMISSION_STATUS.IN_CARE]: [ADMISSION_STATUS.WITH_EPICRISIS],
  [ADMISSION_STATUS.WITH_EPICRISIS]: [ADMISSION_STATUS.BILLED],
} as const;

export const ADMISSION_STATE_REVERSE_MACHINE: Record<string, readonly string[]> = {
  [ADMISSION_STATUS.IN_CARE]: [ADMISSION_STATUS.REGISTERED],
  [ADMISSION_STATUS.WITH_EPICRISIS]: [ADMISSION_STATUS.IN_CARE],
} as const;

export const ADMISSION_STATUSES = [
  ADMISSION_STATUS.REGISTERED,
  ADMISSION_STATUS.IN_CARE,
  ADMISSION_STATUS.WITH_EPICRISIS,
  ADMISSION_STATUS.BILLED,
  ADMISSION_STATUS.DISCHARGED,
] as const;

export const ADMISSION_ERROR_CODES = {
  ACTIVE_ADMISSION_EXISTS: 'ACTIVE_ADMISSION_EXISTS',
  BED_UNAVAILABLE: 'BED_UNAVAILABLE',
  BED_NOT_OCCUPIED: 'BED_NOT_OCCUPIED',
  ADMISSION_ALREADY_DISCHARGED: 'ADMISSION_ALREADY_DISCHARGED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  ADMISSION_STATE_UNCHANGED: 'ADMISSION_STATE_UNCHANGED',
  AUTH_ALREADY_EXISTS: 'AUTH_ALREADY_EXISTS',
  SERVICE_BLOCKED_FOR_BILLING: 'SERVICE_BLOCKED_FOR_BILLING',
} as const;

export const ADMISSION_NOTIFICATIONS = {
  ADMISSION_CREATED: {
    type: 'ADMISSION_CREATED',
    title: 'Nueva admisión registrada',
    actionUrl: '/dashboard/admission',
    actionLabel: 'Ver admisiones',
    messageTemplate: 'Se registró la admisión {admissionNumber} para paciente {firstName} {lastName}',
  },
  ADMISSION_DISCHARGED: {
    type: 'ADMISSION_DISCHARGED',
    title: 'Admisión egresada',
    actionUrl: '/dashboard/admission/census',
    actionLabel: 'Ver censo',
    messageTemplate: 'Se egresó la admisión {admissionNumber} y se liberó la cama asignada',
  },
} as const;

export type AdmissionNotificationConfig = (typeof ADMISSION_NOTIFICATIONS)[keyof typeof ADMISSION_NOTIFICATIONS];

export const ERROR_MESSAGES_USERS = {
  EMAIL_VALID: 'El correo electrónico debe ser válido',
  DNI_REQUIRED_MAX: 'El DNI es requerido y debe tener máximo 20 caracteres',
  FIRST_NAME_REQUIRED: 'El nombre es requerido',
  LAST_NAME_REQUIRED: 'El apellido es requerido',
  ROLE_REQUIRED: 'El rol es requerido',
  PERMISSIONS_ARRAY: 'Los permisos deben ser un array',
  INVALID_USER_ID: 'El ID de usuario debe ser un número válido',
  PERMISSION_MENU_VALID: 'Cada permiso debe tener un menuOptionId válido',
  PERMISSION_HAS_ACCESS_BOOLEAN: 'Cada permiso debe tener un valor booleano para hasAccess',
  INVALID_ID: 'El ID debe ser un número válido',
  PERMISSIONS_UPDATED: 'Permisos actualizados correctamente',
  NO_ROLE: 'Sin rol',
  USER_STATUS_TOGGLED_MSG: 'Usuario {statusLabel} correctamente.',
} as const;

export const ERROR_MESSAGES_CATALOGS = {
  CATALOG_NOT_FOUND: 'Catálogo no encontrado: {type}',
} as const;

export const ERROR_MESSAGES_NOTIFICATIONS = {
  NOTIFICATION_MARKED_READ: 'Notificación marcada como leída',
  NOTIFICATIONS_MARKED_READ: 'Todas las notificaciones marcadas como leídas',
} as const;

export const USER_STATUS_ACTIONS = {
  ACTIVATED: 'activado',
  DEACTIVATED: 'desactivado',
} as const;

export const USER_NOTIFICATIONS = {
  USER_CREATED: {
    type: 'USER_CREATED',
    title: 'Nuevo usuario registrado',
    actionUrl: '/dashboard/users',
    actionLabel: 'Ver usuarios',
    messageTemplate: '{actorName} ({actorRole}) creó al usuario {firstName} {lastName} ({roleName})',
  },
  USER_TOGGLED: {
    type: 'USER_TOGGLED',
    title: 'Usuario {action}',
    actionUrl: '/dashboard/users',
    actionLabel: 'Ver usuarios',
    messageTemplate: '{actorName} ({actorRole}) {action} al usuario {firstName} {lastName}',
  },
} as const;

export type UserNotificationConfig = (typeof USER_NOTIFICATIONS)[keyof typeof USER_NOTIFICATIONS];

export const API_VERSION = 'v1';
export const API_PREFIX = '/api/v1';