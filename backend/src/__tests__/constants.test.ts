import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES, JWT_CONFIG, PAGINATION } from '../constants';

describe('Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have correct status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.CONFLICT).toBe(409);
      expect(HTTP_STATUS.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have correct error codes', () => {
      expect(ERROR_CODES.USER_NOT_FOUND).toBe('401');
      expect(ERROR_CODES.INVALID_PASSWORD).toBe('402');
      expect(ERROR_CODES.USER_INACTIVE).toBe('403');
      expect(ERROR_CODES.EMAIL_EXISTS).toBe('405');
      expect(ERROR_CODES.DNI_EXISTS).toBe('406');
      expect(ERROR_CODES.RESOURCE_NOT_FOUND).toBe('404');
      expect(ERROR_CODES.FORBIDDEN).toBe('403');
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('422');
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('500');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all error messages defined', () => {
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.INVALID_PASSWORD).toBeDefined();
      expect(ERROR_MESSAGES.USER_INACTIVE).toBeDefined();
      expect(ERROR_MESSAGES.EMAIL_EXISTS).toBeDefined();
      expect(ERROR_MESSAGES.DNI_EXISTS).toBeDefined();
      expect(ERROR_MESSAGES.RESOURCE_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.INTERNAL_ERROR).toBeDefined();
    });
  });

  describe('JWT_CONFIG', () => {
    it('should have correct JWT config', () => {
      expect(JWT_CONFIG.EXPIRES_IN).toBe('24h');
      expect(JWT_CONFIG.ALGORITHM).toBe('HS256');
    });
  });

  describe('PAGINATION', () => {
    it('should have correct pagination defaults', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
      expect(PAGINATION.DEFAULT_LIMIT).toBe(50);
      expect(PAGINATION.MAX_LIMIT).toBe(100);
    });
  });
});