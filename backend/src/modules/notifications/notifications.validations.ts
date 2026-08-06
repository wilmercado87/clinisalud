import { param } from "express-validator";
import { ERROR_MESSAGES_USERS } from "../../constants";

export const notificationIdParamValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_USERS.INVALID_ID),
];
