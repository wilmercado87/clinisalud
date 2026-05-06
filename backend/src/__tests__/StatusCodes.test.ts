import { getHttpCode } from '../utils/StatusCodes';

describe('StatusCodes', () => {
  describe('getHttpCode', () => {
    it('should return 401 for USER_NOT_FOUND', () => {
      expect(getHttpCode('401')).toBe(401);
    });

    it('should return 401 for INVALID_PASSWORD', () => {
      expect(getHttpCode('402')).toBe(401);
    });

    it('should return 403 for USER_INACTIVE', () => {
      expect(getHttpCode('403')).toBe(403);
    });

    it('should return 404 for RESOURCE_NOT_FOUND', () => {
      expect(getHttpCode('404')).toBe(404);
    });

    it('should return 409 for EMAIL_EXISTS', () => {
      expect(getHttpCode('405')).toBe(409);
    });

    it('should return 409 for DNI_EXISTS', () => {
      expect(getHttpCode('406')).toBe(409);
    });

    it('should return 422 for VALIDATION_ERROR', () => {
      expect(getHttpCode('422')).toBe(422);
    });

    it('should return 500 for unknown code', () => {
      expect(getHttpCode('999')).toBe(500);
    });

    it('should handle error with message (CODE:Message format)', () => {
      expect(getHttpCode('404:Patient not found')).toBe(404);
    });
  });
});