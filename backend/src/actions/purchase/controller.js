const { PurchaseSetter } = require("./setter");
const { PurchaseGetter } = require("./getter");
const { Supplier } = require("../../models/supplier.model");
const { Product } = require("../../models/product.model");
const { PaymentSetter } = require("../payment/setter");
const { ErpPurchaseInvoiceService } = require("../../helpers/erpnext/purchase-invoice.service");
const { ErpPaymentEntryService } = require("../../helpers/erpnext/payment-entry.service");
const { ErpSupplierService } = require("../../helpers/erpnext/supplier.service");
const { ErpItemService } = require("../../helpers/erpnext/item.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
const { AccountingAdapter } = require("../../plugins/accounting/index");
class PurchaseController {
  /**
   * Helper: Resolves ERPNext Supplier name (syncs to ERPNext if needed).
   */
  static async resolveErpSupplier(supplierId) {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }
    if (supplier.erpnextSupplierId) {
      return supplier.erpnextSupplierId;
    }
    const syncedName = await ErpSupplierService.sync({
      name: supplier.name,
      supplierType: supplier.supplierType,
      phone: supplier.phone,
      email: supplier.email,
      gstin: supplier.gstin
    });
    supplier.erpnextSupplierId = syncedName;
    await supplier.save();
    return syncedName;
  }
  /**
   * Record a Stock Purchase: saves in MariaDB + syncs Purchase Invoice and Supplier Payment to ERPNext.
   */
  static async add(req, res, next) {
    try {
      const { supplierId, paymentStatus, paidAmount, paymentMethod, notes, items } = req.body;
      if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Supplier ID and at least one purchase item are required."
        });
        return;
      }
      const purchase = await PurchaseSetter.createPurchase({
        supplierId,
        paymentStatus,
        paidAmount,
        notes,
        items
      });
      const fullPurchase = await PurchaseGetter.fetchById(purchase.id);
      if (!fullPurchase) {
        throw new Error(`Failed to retrieve newly created purchase ID ${purchase.id}`);
      }
      let erpInvoiceName = null;
      let erpPaymentName = null;
      let erpInvoiceError = null;
      let erpPaymentError = null;

      // ── EAccounting Plugin Branch ──────────────────────────────────────────
      if (!AccountingAdapter.isErpAccounting()) {
        const eaccSyncLog = await ErpSyncSetter.createLog({
          localTransactionId: String(purchase.id),
          transactionType: "PURCHASE_INVOICE_SYNC",
          erpnextDocumentType: "EAccounting Bill",
          syncStatus: "PROCESSING",
        });
        try {
          const eaccResult = await AccountingAdapter.syncPurchase(purchase, fullPurchase);
          if (eaccResult && eaccResult.success) {
            await ErpSyncSetter.markSynced(eaccSyncLog.id, eaccResult.eaccDocId);
            erpInvoiceName = eaccResult.eaccDocId;
          } else {
            erpInvoiceError = eaccResult?.error || "EAccounting purchase sync failed";
            await ErpSyncSetter.markFailed(eaccSyncLog.id, erpInvoiceError);
          }
        } catch (eaccErr) {
          erpInvoiceError = eaccErr instanceof Error ? eaccErr.message : String(eaccErr);
          await ErpSyncSetter.markFailed(eaccSyncLog.id, erpInvoiceError);
        }
      } else {
      // ── Original ERPNext Sync Block (unchanged) ────────────────────────────
      const invoiceSyncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(purchase.id),
        transactionType: "PURCHASE_INVOICE_SYNC",
        erpnextDocumentType: "Purchase Invoice",
        syncStatus: "PROCESSING"
      });
      try {
        const erpSupplierName = await PurchaseController.resolveErpSupplier(purchase.supplierId);
        const invoiceItems = [];
        for (const item of fullPurchase.items || []) {
          let itemCode = item.sku;
          const product = await Product.findByPk(item.productId);
          if (product) {
            if (product.erpnextItemCode) {
              itemCode = product.erpnextItemCode;
            } else {
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
          }
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName
          });
        }
        const invoiceResult = await ErpPurchaseInvoiceService.createAndSubmitPurchaseInvoice({
          supplierName: erpSupplierName,
          items: invoiceItems,
          remarks: `Stock Purchase #${purchase.purchaseNumber}`
        });
        erpInvoiceName = invoiceResult.invoiceName;
        purchase.erpnextPurchaseInvoiceId = erpInvoiceName;
        await purchase.save();
        await ErpSyncSetter.markSynced(invoiceSyncLog.id, erpInvoiceName);
        if (Number(purchase.paidAmount) > 0) {
          const paymentSyncLog = await ErpSyncSetter.createLog({
            localTransactionId: String(purchase.id),
            transactionType: "SUPPLIER_PAYMENT_SYNC",
            erpnextDocumentType: "Payment Entry",
            syncStatus: "PROCESSING"
          });
          try {
            const localPayment = await PaymentSetter.createPayment({
              paymentType: "SUPPLIER_PAYMENT",
              referenceType: "PURCHASE",
              referenceId: purchase.id,
              partyType: "SUPPLIER",
              partyId: purchase.supplierId,
              amount: Number(purchase.paidAmount),
              paymentMethod: paymentMethod || "BANK",
              transactionReference: purchase.purchaseNumber,
              notes: `Payment for Purchase #${purchase.purchaseNumber}`
            });
            const paymentResult = await ErpPaymentEntryService.createAndSubmitSupplierPayment({
              supplierName: erpSupplierName,
              amount: Number(purchase.paidAmount),
              paymentMethod: paymentMethod || "WIRE_TRANSFER",
              invoiceName: erpInvoiceName,
              referenceNumber: purchase.purchaseNumber,
              remarks: `Payment for Purchase Invoice ${purchase.purchaseNumber}`
            });
            erpPaymentName = paymentResult.paymentName;
            localPayment.erpnextPaymentEntryId = erpPaymentName;
            await localPayment.save();
            await ErpSyncSetter.markSynced(paymentSyncLog.id, erpPaymentName);
          } catch (payErr) {
            erpPaymentError = payErr instanceof Error ? payErr.message : String(payErr);
            await ErpSyncSetter.markFailed(paymentSyncLog.id, erpPaymentError);
          }
        }
      } catch (invErr) {
        erpInvoiceError = invErr instanceof Error ? invErr.message : String(invErr);
        await ErpSyncSetter.markFailed(invoiceSyncLog.id, erpInvoiceError);
      }
      } // end else (ERPNext sync block)
      const refreshed = await PurchaseGetter.fetchById(purchase.id);
      res.status(201).json({
        success: true,
        message: "Stock purchase recorded successfully.",
        data: refreshed,
        erpSync: {
          invoice: {
            status: erpInvoiceName ? "SYNCED" : "FAILED",
            erpnextPurchaseInvoiceId: erpInvoiceName,
            error: erpInvoiceError
          },
          payment: {
            status: erpPaymentName ? "SYNCED" : Number(purchase.paidAmount) > 0 ? erpPaymentError ? "FAILED" : "SKIPPED" : "SKIPPED",
            erpnextPaymentId: erpPaymentName,
            error: erpPaymentError
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Manual / Retry ERPNext Sync for a specific Purchase.
   */
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid purchase ID" });
        return;
      }
      const purchase = await PurchaseGetter.fetchById(id);
      if (!purchase) {
        res.status(404).json({ success: false, message: `Purchase ${id} not found` });
        return;
      }
      const erpSupplierName = await PurchaseController.resolveErpSupplier(purchase.supplierId);
      if (!purchase.erpnextPurchaseInvoiceId) {
        const invoiceItems = [];
        for (const item of purchase.items || []) {
          const itemCode = item.product?.erpnextItemCode || item.sku;
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName
          });
        }
        const invoiceResult = await ErpPurchaseInvoiceService.createAndSubmitPurchaseInvoice({
          supplierName: erpSupplierName,
          items: invoiceItems,
          remarks: `Stock Purchase #${purchase.purchaseNumber}`
        });
        purchase.erpnextPurchaseInvoiceId = invoiceResult.invoiceName;
        await purchase.save();
      }
      if (Number(purchase.paidAmount) > 0 && purchase.erpnextPurchaseInvoiceId) {
        const paymentResult = await ErpPaymentEntryService.createAndSubmitSupplierPayment({
          supplierName: erpSupplierName,
          amount: Number(purchase.paidAmount),
          invoiceName: purchase.erpnextPurchaseInvoiceId,
          referenceNumber: purchase.purchaseNumber,
          remarks: `Payment for Purchase Invoice ${purchase.purchaseNumber}`
        });
        purchase.erpnextReceiptId = paymentResult.paymentName;
        await purchase.save();
      }
      const refreshed = await PurchaseGetter.fetchById(purchase.id);
      res.status(200).json({
        success: true,
        message: "Purchase successfully synced to ERPNext.",
        data: refreshed
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(502).json({
        success: false,
        message: `ERPNext sync failed: ${errorMsg}`
      });
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid purchase ID" });
        return;
      }
      await PurchaseSetter.deletePurchase(id);
      res.status(200).json({
        success: true,
        message: `Purchase with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  PurchaseController,
};
