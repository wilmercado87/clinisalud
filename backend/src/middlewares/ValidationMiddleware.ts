import { validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((err) => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      }));

      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: formattedErrors,
      });
    }

    next();
  };
};

export const validateBody = (validations: ValidationChain[]) => {
  return validate(validations);
};

export const validateParams = (validations: ValidationChain[]) => {
  return validate(validations);
};

export const validateQuery = (validations: ValidationChain[]) => {
  return validate(validations);
};