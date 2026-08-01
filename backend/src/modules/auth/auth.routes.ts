import { Router } from 'express';
import { login, updateProfile, changePassword } from './auth.controller';
import { authenticateToken } from '../../middlewares/AuthMiddleware';
import { validateBody } from '../../middlewares/ValidationMiddleware';
import { loginValidation, updateProfileValidation, changePasswordValidation } from './auth.validations';

const router = Router();

router.post('/login', validateBody(loginValidation), login);
router.patch('/profile', authenticateToken, validateBody(updateProfileValidation), updateProfile);
router.patch('/change-password', authenticateToken, validateBody(changePasswordValidation), changePassword);

export default router;
