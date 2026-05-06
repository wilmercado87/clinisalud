import express from 'express';
import cors from 'cors';
import { API_PREFIX } from './constants';
import authRoutes from './routes/AuthRoutes';
import userRoutes from './routes/UserRoutes';
import { securityMiddleware, generalLimiter } from './middlewares/SecurityMiddleware';
import { errorHandler, notFoundHandler } from './middlewares/ErrorHandlerMiddleware';
import { logInfo, healthCheck, rootEndpoint } from './utils';
import swaggerUiExpress from './config/swagger';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(securityMiddleware);
app.use(cors());
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', rootEndpoint);
app.get('/health', healthCheck);

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(API_PREFIX, userRoutes);

app.use('/api-docs', swaggerUiExpress.serve, swaggerUiExpress.setup(swaggerSpec));
app.get('/api-docs.json', (req: express.Request, res: express.Response) => {
  res.json(swaggerSpec);
});

app.use(notFoundHandler);
app.use(errorHandler);

logInfo('Express app configured successfully');

export default app;