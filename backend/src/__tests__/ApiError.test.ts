import { ApiError } from '../middlewares/ErrorHandlerMiddleware';
import { HTTP_STATUS } from '../constants';

describe('ApiError', () => {
  describe('Constructor', () => {
    it('should create error with default status code', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status code and code', () => {
      const error = new ApiError('Not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('Static methods', () => {
    it('notFound should return error with 404', () => {
      const error = ApiError.notFound('Resource not found');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('notFound with default message', () => {
      const error = ApiError.notFound();
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toBeTruthy();
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
    });

    it('unauthorized should return error with 401', () => {
      const error = ApiError.unauthorized('Invalid credentials');
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toBe('Invalid credentials');
      expect(error.code).toBe('USER_NOT_FOUND');
    });

    it('forbidden should return error with 403', () => {
      const error = ApiError.forbidden('Access denied');
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('FORBIDDEN');
    });

    it('badRequest should return error with 400', () => {
      const error = ApiError.badRequest('Invalid input');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('conflict should return error with 409', () => {
      const error = ApiError.conflict('Duplicate entry');
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toBe('Duplicate entry');
      expect(error.code).toBe('DNI_EXISTS');
    });

    it('conflict should accept custom error code', () => {
      const error = ApiError.conflict('Custom conflict', 'CUSTOM_CODE');
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toBe('Custom conflict');
      expect(error.code).toBe('CUSTOM_CODE');
    });

    it('emailExists should return error with 409 and EMAIL_EXISTS code', () => {
      const error = ApiError.emailExists();
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toBeTruthy();
      expect(error.code).toBe('EMAIL_EXISTS');
    });

    it('internal should return error with 500', () => {
      const error = ApiError.internal('Server error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.message).toBe('Server error');
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });
});