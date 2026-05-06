import { Router } from 'express';
import { login } from '../controllers/AuthController';
import { validateBody } from '../middlewares/ValidationMiddleware';
import { loginValidation } from '../middlewares/validations';

const router = Router();

router.post('/login', validateBody(loginValidation), login);

export default router;