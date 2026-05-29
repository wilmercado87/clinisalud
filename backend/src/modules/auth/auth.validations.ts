import { body } from 'express-validator';

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('El correo electrónico debe ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage('La contraseña es requerida'),
];

export const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre debe tener entre 1 y 100 caracteres'),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El apellido debe tener entre 1 y 100 caracteres'),
  body('phone')
    .optional({ values: 'falsy' })
    .isLength({ min: 7, max: 15 })
    .withMessage('El teléfono debe tener entre 7 y 15 dígitos'),
  body('address')
    .optional({ values: 'falsy' })
    .isLength({ max: 255 })
    .withMessage('La dirección debe tener máximo 255 caracteres'),
];
