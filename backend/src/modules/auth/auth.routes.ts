import { Router } from 'express';
import { login, updateProfile, changePassword, forgotPassword } from './auth.controller';
import { authenticateToken } from '../../middlewares/AuthMiddleware';
import { validateBody } from '../../middlewares/ValidationMiddleware';
import { loginValidation, updateProfileValidation, changePasswordValidation, forgotPasswordValidation } from './auth.validations';
import { authLimiter } from '../../middlewares/SecurityMiddleware';

const router = Router();

router.post('/login', authLimiter, validateBody(loginValidation), login);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordValidation), forgotPassword);
router.patch('/profile', authenticateToken, validateBody(updateProfileValidation), updateProfile);
router.patch('/change-password', authenticateToken, validateBody(changePasswordValidation), changePassword);

export default router;
