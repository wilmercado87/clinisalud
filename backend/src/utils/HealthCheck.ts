import { Request, Response } from 'express';
import sequelize from '../config/database';
import { API_VERSION } from '../constants';

export const healthCheck = async (req: Request, res: Response) => {
  try {
    await sequelize.query('SELECT 1');
    res.status(200).json({
      success: true,
      status: 'healthy',
      database: 'connected',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    });
  }
};

export const rootEndpoint = (req: Request, res: Response) => {
  res.send(`Clinisalud API ${API_VERSION} Running with SQLite`);
};