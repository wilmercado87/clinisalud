import { ApiError } from '../middlewares/ErrorHandlerMiddleware';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

describe('ApiError', () => {
  describe('Constructor', () => {
    it('should create error with default status code', () => {
      const error = new ApiError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.isOperational).toBe(true);
    });

    it('should create error with custom status code', () => {
      const error = new ApiError('Not found', HTTP_STATUS.NOT_FOUND);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('Static methods', () => {
    it('notFound should return error with 404', () => {
      const error = ApiError.notFound('Resource not found');
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toContain(ERROR_CODES.RESOURCE_NOT_FOUND);
      expect(error.message).toContain('Resource not found');
    });

    it('notFound with default message', () => {
      const error = ApiError.notFound();
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      expect(error.message).toContain(ERROR_CODES.RESOURCE_NOT_FOUND);
    });

    it('unauthorized should return error with 401', () => {
      const error = ApiError.unauthorized('Invalid credentials');
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(error.message).toContain(ERROR_CODES.USER_NOT_FOUND);
      expect(error.message).toContain('Invalid credentials');
    });

    it('forbidden should return error with 403', () => {
      const error = ApiError.forbidden('Access denied');
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
      expect(error.message).toContain(ERROR_CODES.FORBIDDEN);
      expect(error.message).toContain('Access denied');
    });

    it('badRequest should return error with 400', () => {
      const error = ApiError.badRequest('Invalid input');
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(error.message).toBe('Invalid input');
    });

    it('conflict should return error with 409', () => {
      const error = ApiError.conflict('Duplicate entry');
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toContain(ERROR_CODES.DNI_EXISTS);
      expect(error.message).toContain('Duplicate entry');
    });

    it('emailExists should return error with 405', () => {
      const error = ApiError.emailExists();
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
      expect(error.message).toContain(ERROR_CODES.EMAIL_EXISTS);
    });

    it('internal should return error with 500', () => {
      const error = ApiError.internal('Server error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.message).toContain(ERROR_CODES.INTERNAL_ERROR);
      expect(error.message).toContain('Server error');
    });
  });
});