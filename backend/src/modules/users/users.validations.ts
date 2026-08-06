import { body, param } from 'express-validator';
import { ERROR_MESSAGES_USERS } from '../../constants';

export const createUserValidation = [
  body('email')
    .isEmail()
    .withMessage(ERROR_MESSAGES_USERS.EMAIL_VALID)
    .normalizeEmail(),
  body('dni')
    .isLength({ min: 1, max: 20 })
    .withMessage(ERROR_MESSAGES_USERS.DNI_REQUIRED_MAX),
  body('firstName')
    .isLength({ min: 1, max: 100 })
    .withMessage(ERROR_MESSAGES_USERS.FIRST_NAME_REQUIRED),
  body('lastName')
    .isLength({ min: 1, max: 100 })
    .withMessage(ERROR_MESSAGES_USERS.LAST_NAME_REQUIRED),
  body('roleId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.ROLE_REQUIRED),
  body('permissions')
    .isArray()
    .withMessage(ERROR_MESSAGES_USERS.PERMISSIONS_ARRAY),
];

export const updatePermissionsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.INVALID_USER_ID),
  body('permissions')
    .isArray()
    .withMessage(ERROR_MESSAGES_USERS.PERMISSIONS_ARRAY),
  body('permissions.*.menuOptionId')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.PERMISSION_MENU_VALID),
  body('permissions.*.hasAccess')
    .isBoolean()
    .withMessage(ERROR_MESSAGES_USERS.PERMISSION_HAS_ACCESS_BOOLEAN),
];

export const toggleStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.INVALID_USER_ID),
];

export const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.INVALID_ID),
];