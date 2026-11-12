import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import actionsRouter from './actions';
import { errorHandler, notFoundHandler } from './helpers/middleware/error.middleware';
import swaggerDocument from './helpers/swagger.json';

const app: Application = express();

// Security and utility middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets and styles to load cleanly
  })
);
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger / OpenAPI Interactive Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api/swagger.json', (_req: Request, res: Response) => {
  res.status(200).json(swaggerDocument);
});

// Root welcome endpoint
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    message: 'Clothing & Textiles Shop Management API with ERPNext Accounting Integration',
    version: '1.0.0',
    documentation: {
      swaggerUI: '/api/docs',
      swaggerSpec: '/api/swagger.json',
      healthCheck: '/api/health',
      databaseTest: '/api/database/test',
      databaseTables: '/api/database/tables',
      dashboard: '/api/dashboard',
    },
  });
});

// Mount all API routes through centralized actions router
app.use('/api', actionsRouter);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
