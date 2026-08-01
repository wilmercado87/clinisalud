export const PROFILE_ERROR_RULES = {
  firstName: [['required', 'El nombre es requerido']],
  lastName: [['required', 'El apellido es requerido']],
  phone: [['pattern', 'El teléfono debe tener entre 7 y 15 dígitos']],
  currentPassword: [['required', 'La contraseña actual es requerida']],
  newPassword: [['required', 'La nueva contraseña es requerida']],
} satisfies Record<string, [string, string][]>;
