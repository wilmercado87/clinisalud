import express from 'express';
import cors from 'cors';
import { API_PREFIX } from './constants';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import catalogRoutes from './modules/catalogs/catalogs.routes';
import admissionRoutes from './modules/admissions/admissions.routes';
import { securityMiddleware, generalLimiter } from './middlewares/SecurityMiddleware';
import { errorHandler, notFoundHandler } from './middlewares/ErrorHandlerMiddleware';
import { logInfo, healthCheck, rootEndpoint, resolveAllowedOrigins } from './utils';
import swaggerUiExpress from './config/swagger';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(securityMiddleware);
app.use(
  cors({
    origin: resolveAllowedOrigins(),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', rootEndpoint);
app.get('/health', healthCheck);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(API_PREFIX, userRoutes);
app.use(API_PREFIX, notificationRoutes);
app.use(API_PREFIX, catalogRoutes);
app.use(API_PREFIX, admissionRoutes);

app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerSpec));
app.get('/api-docs.json', (req: express.Request, res: express.Response) => {
  res.json(swaggerSpec);
});

app.use(notFoundHandler);
app.use(errorHandler);

logInfo('Express app configured successfully');

export default app;