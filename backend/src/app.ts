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
import { logInfo, healthCheck, rootEndpoint, resolveAllowedOrigins, isOriginAllowed } from './utils';
import swaggerUiExpress, { swaggerSpec } from './config/swagger';

const app = express();

// Configuración dinámica de CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowed = resolveAllowedOrigins();
    if (isOriginAllowed(origin, allowed)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control'],
  credentials: true,
  maxAge: 86400,
};

// 1. Aplicar CORS como primer middleware e interceptar preflights (OPTIONS)
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Middlewares globales
app.use(securityMiddleware);
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Rutas principales
app.get('/', rootEndpoint);
app.get('/health', healthCheck);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(API_PREFIX, userRoutes);
app.use(API_PREFIX, notificationRoutes);
app.use(API_PREFIX, catalogRoutes);
app.use(API_PREFIX, admissionRoutes);

// 4. Documentación
app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerSpec));
app.get('/api-docs.json', (req: express.Request, res: express.Response) => {
  res.json(swaggerSpec);
});

// 5. Control de errores
app.use(notFoundHandler);
app.use(errorHandler);

logInfo('Express app configured successfully');

export default app;