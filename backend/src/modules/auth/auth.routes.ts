import { Router } from 'express';
import { login, updateProfile } from './auth.controller';
import { authenticateToken } from '../../middlewares/AuthMiddleware';
import { validateBody } from '../../middlewares/ValidationMiddleware';
import { loginValidation, updateProfileValidation } from './auth.validations';

const router = Router();

router.post('/login', validateBody(loginValidation), login);
router.patch('/profile', authenticateToken, validateBody(updateProfileValidation), updateProfile);

export default router;
