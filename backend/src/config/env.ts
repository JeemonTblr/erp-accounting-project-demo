import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'textile_erp_db',
    user: process.env.DB_USER || 'textile_admin',
    password: process.env.DB_PASSWORD || 'textile_password',
    dialect: 'mariadb' as const,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
      idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  erpnext: {
    baseUrl: process.env.ERPNEXT_BASE_URL || 'http://127.0.0.1:8000',
    apiKey: process.env.ERPNEXT_API_KEY || '',
    apiSecret: process.env.ERPNEXT_API_SECRET || '',
    company: process.env.ERPNEXT_COMPANY || 'cubet',
  },
};

