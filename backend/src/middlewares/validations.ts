import { body, param } from 'express-validator';

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('El correo electrónico debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('La contraseña es requerida'),
];

export const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage('El correo electrónico debe ser válido')
    .normalizeEmail(),
  body('dni')
    .isLength({ min: 1, max: 20 })
    .withMessage('El DNI es requerido y debe tener máximo 20 caracteres'),
  body('firstName')
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre es requerido'),
  body('lastName')
    .isLength({ min: 1, max: 100 })
    .withMessage('El apellido es requerido'),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage('El rol es requerido'),
  body('permissions')
    .isArray()
    .withMessage('Los permisos deben ser un array'),
];

export const updatePermissionsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de usuario debe ser un número válido'),
  body('permissions')
    .isArray()
    .withMessage('Los permisos deben ser un array'),
  body('permissions.*.menuOptionId')
    .isInt({ min: 1 })
    .withMessage('Cada permiso debe tener un menuOptionId válido'),
  body('permissions.*.hasAccess')
    .isBoolean()
    .withMessage('Cada permiso debe tener un valor booleano para hasAccess'),
];

export const toggleStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de usuario debe ser un número válido'),
];

export const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número válido'),
];