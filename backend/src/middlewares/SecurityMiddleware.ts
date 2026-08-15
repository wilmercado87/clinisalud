import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ERROR_MESSAGES } from '../constants';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: ERROR_MESSAGES.RATE_LIMIT_TOO_MANY,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: ERROR_MESSAGES.RATE_LIMIT_LOGIN,
  },
  standardHeaders: true,
  legacyHeaders: false,
});