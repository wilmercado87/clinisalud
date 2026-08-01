export const PROFILE_ERROR_RULES = {
  email: [
    ['required', 'El correo electrónico es requerido'],
    ['email', 'El correo electrónico debe ser válido'],
  ],
  firstName: [['required', 'El nombre es requerido']],
  lastName: [['required', 'El apellido es requerido']],
  phone: [['pattern', 'El teléfono debe tener entre 7 y 15 dígitos']],
  currentPassword: [['required', 'La contraseña actual es requerida']],
  newPassword: [['required', 'La nueva contraseña es requerida']],
} satisfies Record<string, [string, string][]>;
