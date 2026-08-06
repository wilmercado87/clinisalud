import { body } from 'express-validator';
import { ERROR_MESSAGES_AUTH } from '../../constants';

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage(ERROR_MESSAGES_AUTH.EMAIL_VALID)
    .normalizeEmail(),
  body('password')
    .isLength({ min: 1 })
    .withMessage(ERROR_MESSAGES_AUTH.PASSWORD_REQUIRED),
];

export const updateProfileValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage(ERROR_MESSAGES_AUTH.EMAIL_VALID)
    .normalizeEmail(),
  body('firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage(ERROR_MESSAGES_AUTH.FIRST_NAME_LENGTH),
  body('lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage(ERROR_MESSAGES_AUTH.LAST_NAME_LENGTH),
  body('phone')
    .optional({ values: 'falsy' })
    .isLength({ min: 7, max: 15 })
    .withMessage(ERROR_MESSAGES_AUTH.PHONE_LENGTH),
  body('address')
    .optional({ values: 'falsy' })
    .isLength({ max: 255 })
    .withMessage(ERROR_MESSAGES_AUTH.ADDRESS_MAX),
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage(ERROR_MESSAGES_AUTH.EMAIL_VALID)
    .normalizeEmail(),
];

export const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage(ERROR_MESSAGES_AUTH.CURRENT_PASSWORD_REQUIRED),
  body('newPassword')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(ERROR_MESSAGES_AUTH.NEW_PASSWORD_PATTERN),
];