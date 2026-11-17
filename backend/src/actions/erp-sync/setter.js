const { ErpSyncLog } = require("../../models/erp-sync-log.model");
class ErpSyncSetter {
  static async createLog(data) {
    return ErpSyncLog.create({
      localTransactionId: data.localTransactionId,
      transactionType: data.transactionType,
      erpnextDocumentType: data.erpnextDocumentType,
      erpnextDocumentName: data.erpnextDocumentName || null,
      syncStatus: data.syncStatus || "PENDING",
      errorMessage: data.errorMessage || null,
      payload: data.payload || null,
      retryCount: 0,
      lastSyncedAt: data.syncStatus === "SYNCED" ? /* @__PURE__ */ new Date() : null
    });
  }
  static async markSynced(id, erpnextDocumentName) {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);
    log.syncStatus = "SYNCED";
    log.erpnextDocumentName = erpnextDocumentName;
    log.errorMessage = null;
    log.lastSyncedAt = /* @__PURE__ */ new Date();
    await log.save();
    return log;
  }
  static async markFailed(id, errorMessage) {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);
    log.syncStatus = "FAILED";
    log.errorMessage = errorMessage;
    log.retryCount = Number(log.retryCount) + 1;
    await log.save();
    return log;
  }
  static async deleteLog(id) {
    const log = await ErpSyncLog.findByPk(id);
    if (!log) throw new Error(`Sync log ${id} not found`);
    await log.destroy();
    return true;
  }
}
module.exports = {
  ErpSyncSetter,
};
