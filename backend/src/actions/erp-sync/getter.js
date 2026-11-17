const { ErpSyncLog } = require("../../models/erp-sync-log.model");
class ErpSyncGetter {
  static async fetchById(id) {
    return ErpSyncLog.findByPk(id);
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.status) where.syncStatus = options.status;
    if (options?.transactionType) where.transactionType = options.transactionType;
    return ErpSyncLog.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });
  }
  static async fetchPending() {
    return ErpSyncLog.findAll({
      where: {
        syncStatus: "PENDING"
      },
      order: [["createdAt", "ASC"]]
    });
  }
  static async getAll(req, res, next) {
    try {
      const status = req.query.status;
      const transactionType = req.query.type;
      const logs = await ErpSyncGetter.fetchAll({ status, transactionType });
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid sync log ID" });
        return;
      }
      const log = await ErpSyncGetter.fetchById(id);
      if (!log) {
        res.status(404).json({ success: false, message: `Sync log with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: log
      });
    } catch (error) {
      next(error);
    }
  }
  static async getPending(_req, res, next) {
    try {
      const pending = await ErpSyncGetter.fetchPending();
      res.status(200).json({
        success: true,
        count: pending.length,
        data: pending
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ErpSyncGetter,
};
