import { Request, Response, NextFunction } from 'express';
import { ErpSyncLog } from '../../models/erp-sync-log.model';

export class ErpSyncGetter {
  public static async fetchById(id: number): Promise<ErpSyncLog | null> {
    return ErpSyncLog.findByPk(id);
  }

  public static async fetchAll(options?: {
    status?: string;
    transactionType?: string;
  }): Promise<ErpSyncLog[]> {
    const where: Record<string, unknown> = {};

    if (options?.status) where.syncStatus = options.status;
    if (options?.transactionType) where.transactionType = options.transactionType;

    return ErpSyncLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  public static async fetchPending(): Promise<ErpSyncLog[]> {
    return ErpSyncLog.findAll({
      where: {
        syncStatus: 'PENDING',
      },
      order: [['createdAt', 'ASC']],
    });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const transactionType = req.query.type as string | undefined;

      const logs = await ErpSyncGetter.fetchAll({ status, transactionType });
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid sync log ID' });
        return;
      }

      const log = await ErpSyncGetter.fetchById(id);
      if (!log) {
        res.status(404).json({ success: false, message: `Sync log with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getPending(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pending = await ErpSyncGetter.fetchPending();
      res.status(200).json({
        success: true,
        count: pending.length,
        data: pending,
      });
    } catch (error) {
      next(error);
    }
  }
}

