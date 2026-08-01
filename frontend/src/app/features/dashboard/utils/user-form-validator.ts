export const USER_ERROR_RULES = {
  firstName: [['required', 'El nombre es requerido']],
  lastName: [['required', 'El apellido es requerido']],
  dni: [
    ['required', 'El DNI es requerido'],
    ['pattern', 'El DNI debe contener solo números'],
    ['alreadyExists', 'Este DNI ya está registrado en Clinisalud'],
  ],
  email: [
    ['required', 'El correo electrónico es requerido'],
    ['email', 'Ingrese un correo electrónico válido'],
    ['alreadyExists', 'Este correo ya está en uso'],
  ],
  phone: [
    ['required', 'El teléfono es requerido'],
    ['pattern', 'El teléfono debe tener entre 7 y 10 dígitos'],
  ],
  roleId: [['required', 'El rol es requerido']],
} satisfies Record<string, [string, string][]>;
