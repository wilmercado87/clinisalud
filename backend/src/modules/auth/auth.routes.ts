import { Router } from 'express';
import { login } from './auth.controller';
import { validateBody } from '../../middlewares/ValidationMiddleware';
import { loginValidation } from './auth.validations';

const router = Router();

router.post('/login', validateBody(loginValidation), login);

export default router;
