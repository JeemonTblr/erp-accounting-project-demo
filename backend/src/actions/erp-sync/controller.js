const { ErpSyncSetter } = require("./setter");
class ErpSyncController {
  static async add(req, res, next) {
    try {
      const { localTransactionId, transactionType, erpnextDocumentType, erpnextDocumentName, payload } = req.body;
      if (!localTransactionId || !transactionType || !erpnextDocumentType) {
        res.status(400).json({
          success: false,
          message: "localTransactionId, transactionType, and erpnextDocumentType are required."
        });
        return;
      }
      const log = await ErpSyncSetter.createLog({
        localTransactionId,
        transactionType,
        erpnextDocumentType,
        erpnextDocumentName,
        payload
      });
      res.status(201).json({
        success: true,
        message: "Sync log created successfully.",
        data: log
      });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid sync log ID" });
        return;
      }
      await ErpSyncSetter.deleteLog(id);
      res.status(200).json({
        success: true,
        message: `Sync log with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ErpSyncController,
};
