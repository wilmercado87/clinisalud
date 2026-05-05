import { Sequelize } from 'sequelize';
import { logInfo, logError } from '../utils/Logger';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: (msg: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SQL] ${msg}`);
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

export async function testConnection(): Promise<boolean> {
  try {
    await sequelize.query('SELECT 1');
    logInfo('Database connection verified');
    return true;
  } catch (error) {
    logError('Database connection failed', { error });
    return false;
  }
}

export default sequelize;