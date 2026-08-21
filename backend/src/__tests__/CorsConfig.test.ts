import { isOriginAllowed, normalizeOrigin, resolveAllowedOrigins } from '../utils/CorsConfig';

describe('CorsConfig', () => {
  const originalEnv = process.env['CORS_ORIGIN'];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env['CORS_ORIGIN'];
    } else {
      process.env['CORS_ORIGIN'] = originalEnv;
    }
  });

  describe('normalizeOrigin (INV-SEC-01)', () => {
    it('removes trailing slashes and surrounding spaces', () => {
      expect(normalizeOrigin('https://app.example.com/')).toBe('https://app.example.com');
      expect(normalizeOrigin('  https://app.example.com///  ')).toBe('https://app.example.com');
      expect(normalizeOrigin('http://localhost:4200')).toBe('http://localhost:4200');
    });
  });

  describe('resolveAllowedOrigins', () => {
    it('allows all origins when CORS_ORIGIN is unset (INV-SEC-01)', () => {
      delete process.env['CORS_ORIGIN'];
      expect(resolveAllowedOrigins()).toBe(true);
    });

    it('returns a normalized allowlist when CORS_ORIGIN is set (INV-SEC-01)', () => {
      process.env['CORS_ORIGIN'] = ' https://clinisalud-frontend.onrender.com/ , http://localhost:4200 ';
      const allowed = resolveAllowedOrigins();
      expect(allowed).toEqual([
        'https://clinisalud-frontend.onrender.com',
        'http://localhost:4200',
      ]);
    });

    it('ignores empty entries in the list (INV-SEC-01)', () => {
      process.env['CORS_ORIGIN'] = ' , ,';
      expect(resolveAllowedOrigins()).toBe(true);
    });
  });

  describe('isOriginAllowed', () => {
    it('accepts any origin when allowlist is open (INV-SEC-01)', () => {
      expect(isOriginAllowed('https://anything.com', true)).toBe(true);
    });

    it('matches normalized origins against the allowlist (INV-SEC-01)', () => {
      const allowed = ['https://clinisalud-frontend.onrender.com'];
      expect(isOriginAllowed('https://clinisalud-frontend.onrender.com/', allowed)).toBe(true);
      expect(isOriginAllowed('https://evil.example.com', allowed)).toBe(false);
    });

    it('allows requests without Origin header (non-CORS clients) (INV-SEC-01)', () => {
      expect(isOriginAllowed(undefined, ['https://a.com'])).toBe(true);
    });

    it('supports explicit wildcard entry (INV-SEC-01)', () => {
      expect(isOriginAllowed('https://x.com', ['*'])).toBe(true);
    });
  });
});
