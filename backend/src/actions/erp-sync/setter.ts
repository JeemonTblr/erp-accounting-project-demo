import { ErpSyncLog } from '../../models/erp-sync-log.model';

export class ErpSyncSetter {
  public static async createLog(data: {
    localTransactionId: string;
    transactionType: string;
    erpnextDocumentType: string;
    erpnextDocumentName?: string | null;
    syncStatus?: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
    errorMessage?: string | null;
    payload?: string | null;
  }): Promise<ErpSyncLog> {
    return ErpSyncLog.create({
      localTransactionId: data.localTransactionId,
      transactionType: data.transactionType,
      erpnextDocumentType: data.erpnextDocumentType,
      erpnextDocumentName: data.erpnextDocumentName || null,
      syncStatus: data.syncStatus || 'PENDING',
      errorMessage: data.errorMessage || null,
      payload: data.payload || null,
      retryCount: 0,
      lastSyncedAt: data.syncStatus === 'SYNCED' ? new Date() : null,
    });
  }

  public static async markSynced(id: number, erpnextDocumentName: string): Promise<ErpSyncLog> {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);

    log.syncStatus = 'SYNCED';
    log.erpnextDocumentName = erpnextDocumentName;
    log.errorMessage = null;
    log.lastSyncedAt = new Date();
    await log.save();
    return log;
  }

  public static async markFailed(id: number, errorMessage: string): Promise<ErpSyncLog> {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);

    log.syncStatus = 'FAILED';
    log.errorMessage = errorMessage;
    log.retryCount = Number(log.retryCount) + 1;
    await log.save();
    return log;
  }

  public static async deleteLog(id: number): Promise<boolean> {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);

    await log.destroy();
    return true;
  }
}

