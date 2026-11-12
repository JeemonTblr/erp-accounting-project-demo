import { Sequelize } from 'sequelize';
import { config } from './env';

export const sequelize = new Sequelize(
  config.db.name,
  config.db.user,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mariadb',
    dialectOptions: {
      connectTimeout: 10000,
    },
    pool: {
      max: config.db.pool.max,
      min: config.db.pool.min,
      acquire: config.db.pool.acquire,
      idle: config.db.pool.idle,
    },
    logging: config.env === 'development' ? (msg: string) => {
      // Avoid excessive verbose query spam while logging meaningful SQL
      if (!msg.includes('SHOW FULL TABLES') && !msg.includes('SELECT 1+1')) {
        console.log(`[Sequelize] ${msg}`);
      }
    } : false,
    define: {
      underscored: true,
      timestamps: true,
    },
  }
);

export const testDbConnection = async (): Promise<{ success: boolean; message: string; version?: string }> => {
  try {
    await sequelize.authenticate();
    const [result] = (await sequelize.query('SELECT VERSION() as version')) as unknown as [{ version: string }[]];
    const version = result?.[0]?.version || 'Unknown MariaDB Version';
    return {
      success: true,
      message: 'Successfully connected to MariaDB.',
      version,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to connect to MariaDB: ${errMsg}`,
    };
  }
};

