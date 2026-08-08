import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://clinisalud:clinisalud@localhost:5432/clinisalud';
const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
  dialectOptions: isLocal ? undefined : { ssl: { rejectUnauthorized: false } },
});

export default sequelize;
