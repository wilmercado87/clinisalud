import { Sequelize } from 'sequelize';

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

export default sequelize;