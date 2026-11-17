const { SupplierSetter } = require("./setter");
const { Supplier } = require("../../models/supplier.model");
const { ErpSupplierService } = require("../../helpers/erpnext/supplier.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
class SupplierController {
  static async add(req, res, next) {
    try {
      const { name, phone, email, address, gstin, supplierType } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: "Supplier name is required." });
        return;
      }
      const supplier = await SupplierSetter.createSupplier({
        name,
        phone,
        email,
        address,
        gstin,
        supplierType
      });
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(supplier.id),
        transactionType: "SUPPLIER_SYNC",
        erpnextDocumentType: "Supplier",
        syncStatus: "PROCESSING",
        payload: JSON.stringify({ name: supplier.name, phone: supplier.phone, email: supplier.email, gstin: supplier.gstin })
      });
      let erpSyncStatus = "SYNCED";
      let erpSyncError = null;
      try {
        const erpDocName = await ErpSupplierService.sync({
          name: supplier.name,
          supplierType: supplier.supplierType,
          phone: supplier.phone,
          email: supplier.email,
          gstin: supplier.gstin
        });
        await SupplierSetter.setErpnextId(supplier.id, erpDocName);
        supplier.erpnextSupplierId = erpDocName;
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);
      } catch (err) {
        erpSyncStatus = "FAILED";
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }
      res.status(201).json({
        success: true,
        message: "Supplier created successfully.",
        data: supplier,
        erpSync: {
          status: erpSyncStatus,
          error: erpSyncError
        }
      });
    } catch (error) {
      next(error);
    }
  }
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid supplier ID" });
        return;
      }
      const updated = await SupplierSetter.updateSupplier(id, req.body);
      if (updated.erpnextSupplierId) {
        try {
          await ErpSupplierService.updateSupplier(updated.erpnextSupplierId, {
            name: updated.name,
            supplierType: updated.supplierType,
            phone: updated.phone,
            email: updated.email,
            gstin: updated.gstin
          });
        } catch (err) {
          console.error(`Failed to update supplier in ERPNext: ${err}`);
        }
      }
      res.status(200).json({
        success: true,
        message: "Supplier updated successfully.",
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid supplier ID" });
        return;
      }
      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        res.status(404).json({ success: false, message: `Supplier ${id} not found` });
        return;
      }
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(supplier.id),
        transactionType: "SUPPLIER_SYNC",
        erpnextDocumentType: "Supplier",
        syncStatus: "PROCESSING"
      });
      try {
        const erpDocName = await ErpSupplierService.sync({
          name: supplier.name,
          supplierType: supplier.supplierType,
          phone: supplier.phone,
          email: supplier.email,
          gstin: supplier.gstin,
          existingErpnextId: supplier.erpnextSupplierId
        });
        await SupplierSetter.setErpnextId(supplier.id, erpDocName);
        supplier.erpnextSupplierId = erpDocName;
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);
        res.status(200).json({
          success: true,
          message: "Supplier successfully synced to ERPNext.",
          erpnextSupplierId: erpDocName,
          data: supplier
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`
        });
      }
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid supplier ID" });
        return;
      }
      await SupplierSetter.deleteSupplier(id);
      res.status(200).json({
        success: true,
        message: `Supplier with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  SupplierController,
};
