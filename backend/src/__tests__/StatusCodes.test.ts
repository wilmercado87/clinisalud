import { getHttpCode } from '../utils/StatusCodes';

describe('StatusCodes', () => {
  describe('getHttpCode', () => {
    it('should return statusCode from error object', () => {
      expect(getHttpCode({ statusCode: 401 })).toBe(401);
    });

    it('should return 403 for FORBIDDEN', () => {
      expect(getHttpCode({ statusCode: 403 })).toBe(403);
    });

    it('should return 404 for NOT_FOUND', () => {
      expect(getHttpCode({ statusCode: 404 })).toBe(404);
    });

    it('should return 409 for CONFLICT', () => {
      expect(getHttpCode({ statusCode: 409 })).toBe(409);
    });

    it('should return 422 for UNPROCESSABLE_ENTITY', () => {
      expect(getHttpCode({ statusCode: 422 })).toBe(422);
    });

    it('should return 500 when no statusCode', () => {
      expect(getHttpCode({})).toBe(500);
    });

    it('should return 500 for null/undefined', () => {
      expect(getHttpCode(null)).toBe(500);
      expect(getHttpCode(undefined)).toBe(500);
    });

    it('should return 500 for regular Error without statusCode', () => {
      expect(getHttpCode(new Error('generic'))).toBe(500);
    });
  });
});