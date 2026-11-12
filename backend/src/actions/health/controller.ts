import { Request, Response } from 'express';
import { sequelize, testDbConnection } from '../../config/database';
import { config } from '../../config/env';

const ALLOWED_TABLES = [
  'users',
  'categories',
  'products',
  'product_variants',
  'customers',
  'suppliers',
  'sales',
  'sale_items',
  'purchases',
  'purchase_items',
  'expenses',
  'payments',
  'inventory_transactions',
  'erp_sync_logs',
];

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      service: 'Clothing & Textiles Shop Management API',
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
    });
  }

  public static async testDatabase(_req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const result = await testDbConnection();
    const latencyMs = Date.now() - startTime;

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.message,
        database: config.db.name,
        host: config.db.host,
        port: config.db.port,
        latencyMs,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'MariaDB connection is healthy and responsive.',
      database: config.db.name,
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      version: result.version,
      latencyMs: `${latencyMs}ms`,
      timestamp: new Date().toISOString(),
    });
  }

  public static async getDatabaseTables(_req: Request, res: Response): Promise<void> {
    try {
      const [tables] = (await sequelize.query(
        `SELECT TABLE_NAME as tableName, TABLE_ROWS as estimatedRows, CREATE_TIME as createdAt
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_SCHEMA = :dbName 
         ORDER BY TABLE_NAME ASC`,
        {
          replacements: { dbName: config.db.name },
        }
      )) as unknown as [{ tableName: string; estimatedRows: number; createdAt: string }[]];

      res.status(200).json({
        success: true,
        database: config.db.name,
        tableCount: tables.length,
        tables,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: `Failed to retrieve tables: ${errMsg}`,
      });
    }
  }

  public static async getTableData(req: Request, res: Response): Promise<void> {
    try {
      const { tableName } = req.params;

      if (!ALLOWED_TABLES.includes(tableName)) {
        res.status(400).json({
          success: false,
          message: `Invalid table name "${tableName}". Allowed tables: ${ALLOWED_TABLES.join(', ')}`,
        });
        return;
      }

      const limit = parseInt((req.query.limit as string) || '50', 10);
      const [rows] = await sequelize.query(`SELECT * FROM \`${tableName}\` LIMIT :limit`, {
        replacements: { limit },
      });

      res.status(200).json({
        success: true,
        table: tableName,
        rowCount: (rows as unknown[]).length,
        data: rows,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: `Failed to query table: ${errMsg}`,
      });
    }
  }
}

