const { InventorySetter } = require("./setter");
const { InventoryGetter } = require("./getter");
const { Product } = require("../../models/product.model");
const { ErpStockService } = require("../../helpers/erpnext/stock.service");
const { ErpItemService } = require("../../helpers/erpnext/item.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
class InventoryController {
  /**
   * Record stock adjustment, damage, or return:
   * updates MariaDB local stock + syncs Stock Entry to ERPNext.
   */
  static async add(req, res, next) {
    try {
      const { productId, variantId, transactionType, quantity, notes, referenceType, referenceId } = req.body;
      if (!productId || !transactionType || quantity === void 0) {
        res.status(400).json({
          success: false,
          message: "productId, transactionType, and quantity are required."
        });
        return;
      }
      const tx = await InventorySetter.recordAdjustment({
        productId,
        variantId,
        transactionType,
        quantity,
        notes,
        referenceType,
        referenceId
      });
      const product = await Product.findByPk(productId);
      if (!product) throw new Error(`Product ${productId} not found`);
      let itemCode = product.erpnextItemCode;
      if (!itemCode) {
        itemCode = await ErpItemService.sync({
          sku: product.sku,
          name: product.name,
          sellingPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          stockQuantity: product.stockQuantity
        });
        product.erpnextItemCode = itemCode;
        await product.save();
      }
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(tx.id),
        transactionType: "STOCK_ENTRY_SYNC",
        erpnextDocumentType: "Stock Entry",
        syncStatus: "PROCESSING"
      });
      const isIssue = transactionType === "DAMAGE" || transactionType === "STOCK_OUT" || transactionType === "ADJUSTMENT" && Number(quantity) < 0;
      const entryType = isIssue ? "Material Issue" : "Material Receipt";
      let erpStockEntryId = null;
      let erpSyncStatus = "SYNCED";
      let erpSyncError = null;
      try {
        const result = await ErpStockService.createAndSubmitStockEntry({
          entryType,
          remarks: notes || `Stock ${transactionType} - ${product.name}`,
          items: [
            {
              itemCode,
              qty: Math.abs(Number(quantity)),
              rate: Number(product.purchasePrice)
            }
          ]
        });
        erpStockEntryId = result.stockEntryName;
        tx.erpnextStockEntryId = erpStockEntryId;
        await tx.save();
        await ErpSyncSetter.markSynced(syncLog.id, erpStockEntryId);
      } catch (err) {
        erpSyncStatus = "FAILED";
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }
      const refreshedTx = await InventoryGetter.fetchById(tx.id);
      res.status(201).json({
        success: true,
        message: "Inventory transaction recorded successfully.",
        data: refreshedTx,
        erpSync: {
          status: erpSyncStatus,
          erpnextStockEntryId: erpStockEntryId,
          error: erpSyncError
        }
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Manual / Retry ERPNext Sync for an inventory transaction.
   */
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid transaction ID" });
        return;
      }
      const tx = await InventoryGetter.fetchById(id);
      if (!tx) {
        res.status(404).json({ success: false, message: `Transaction ${id} not found` });
        return;
      }
      const product = await Product.findByPk(tx.productId);
      if (!product) throw new Error("Product not found");
      const isIssue = tx.transactionType === "DAMAGE" || tx.transactionType === "STOCK_OUT" || tx.transactionType === "ADJUSTMENT" && Number(tx.quantity) < 0;
      const entryType = isIssue ? "Material Issue" : "Material Receipt";
      const result = await ErpStockService.createAndSubmitStockEntry({
        entryType,
        remarks: tx.notes || `Stock ${tx.transactionType} - ${product.name}`,
        items: [
          {
            itemCode: product.erpnextItemCode || product.sku,
            qty: Math.abs(Number(tx.quantity)),
            rate: Number(product.purchasePrice)
          }
        ]
      });
      tx.erpnextStockEntryId = result.stockEntryName;
      await tx.save();
      res.status(200).json({
        success: true,
        message: "Stock entry synced to ERPNext.",
        erpnextStockEntryId: result.stockEntryName,
        data: tx
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(502).json({
        success: false,
        message: `ERPNext sync failed: ${errorMsg}`
      });
    }
  }
  /**
   * Get real-time stock balance from ERPNext for a product.
   */
  static async getErpStockBalance(req, res, next) {
    try {
      const productId = parseInt(req.params.productId, 10);
      if (isNaN(productId)) {
        res.status(400).json({ success: false, message: "Invalid product ID" });
        return;
      }
      const product = await Product.findByPk(productId);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }
      const itemCode = product.erpnextItemCode || product.sku;
      const erpBalance = await ErpStockService.getStockBalance(itemCode);
      res.status(200).json({
        success: true,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        erpnextItemCode: itemCode,
        localStockQuantity: product.stockQuantity,
        erpnextStockQuantity: erpBalance,
        synchronized: Number(product.stockQuantity) === Number(erpBalance)
      });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid transaction ID" });
        return;
      }
      await InventorySetter.deleteTransaction(id);
      res.status(200).json({
        success: true,
        message: `Inventory transaction with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  InventoryController,
};
