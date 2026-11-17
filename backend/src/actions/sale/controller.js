const { SaleSetter } = require("./setter");
const { SaleGetter } = require("./getter");
const { Customer } = require("../../models/customer.model");
const { Product } = require("../../models/product.model");
const { PaymentSetter } = require("../payment/setter");
const { ErpSalesInvoiceService } = require("../../helpers/erpnext/sales-invoice.service");
const { ErpPaymentEntryService } = require("../../helpers/erpnext/payment-entry.service");
const { ErpCustomerService } = require("../../helpers/erpnext/customer.service");
const { ErpItemService } = require("../../helpers/erpnext/item.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
const { AccountingAdapter } = require("../../plugins/accounting/index");
class SaleController {
  /**
   * Helper: Resolves ERPNext Customer name (syncs to ERPNext if needed).
   */
  static async resolveErpCustomer(customerId, fallbackName) {
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (customer) {
        if (customer.erpnextCustomerId) {
          return customer.erpnextCustomerId;
        }
        const syncedName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          gstin: customer.gstin
        });
        customer.erpnextCustomerId = syncedName;
        await customer.save();
        return syncedName;
      }
    }
    return fallbackName || "John Doe";
  }
  /**
   * Create a new Sale: saves in MariaDB + syncs Sales Invoice and Payment Entry to ERPNext.
   */
  static async add(req, res, next) {
    try {
      const { customerId, customerName, paymentMethod, paymentStatus, paidAmount, discountAmount, notes, items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: "Sale must contain at least one item."
        });
        return;
      }
      const sale = await SaleSetter.createSale({
        customerId,
        customerName,
        paymentMethod,
        paymentStatus,
        paidAmount,
        discountAmount,
        notes,
        items
      });
      const fullSale = await SaleGetter.fetchById(sale.id);
      if (!fullSale) {
        throw new Error(`Failed to retrieve newly created sale ID ${sale.id}`);
      }
      let erpInvoiceName = null;
      let erpPaymentName = null;
      let erpInvoiceError = null;
      let erpPaymentError = null;

      // ── EAccounting Plugin Branch ──────────────────────────────────────────
      // When ERP_Accounting=False, sync to EAccounting module instead of ERPNext.
      if (!AccountingAdapter.isErpAccounting()) {
        const eaccSyncLog = await ErpSyncSetter.createLog({
          localTransactionId: String(sale.id),
          transactionType: "SALES_INVOICE_SYNC",
          erpnextDocumentType: "EAccounting Invoice",
          syncStatus: "PROCESSING",
        });
        try {
          const eaccResult = await AccountingAdapter.syncSale(sale, fullSale);
          if (eaccResult && eaccResult.success) {
            await ErpSyncSetter.markSynced(eaccSyncLog.id, eaccResult.eaccDocId);
            erpInvoiceName = eaccResult.eaccDocId;
          } else {
            const errMsg = eaccResult?.error || "EAccounting sync failed";
            await ErpSyncSetter.markFailed(eaccSyncLog.id, errMsg);
            erpInvoiceError = errMsg;
          }
        } catch (eaccErr) {
          const errMsg = eaccErr instanceof Error ? eaccErr.message : String(eaccErr);
          await ErpSyncSetter.markFailed(eaccSyncLog.id, errMsg);
          erpInvoiceError = errMsg;
        }
      } else {
      // ── Original ERPNext Sync Block (unchanged) ────────────────────────────
      const invoiceSyncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(sale.id),
        transactionType: "SALES_INVOICE_SYNC",
        erpnextDocumentType: "Sales Invoice",
        syncStatus: "PROCESSING"
      });
      try {
        const erpCustomerName = await SaleController.resolveErpCustomer(sale.customerId, sale.customerName);
        const invoiceItems = [];
        for (const item of fullSale.items || []) {
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
        const invoiceResult = await ErpSalesInvoiceService.createAndSubmitInvoice({
          customerName: erpCustomerName,
          items: invoiceItems,
          remarks: `Sale Invoice #${sale.invoiceNumber}`
        });
        erpInvoiceName = invoiceResult.invoiceName;
        sale.erpnextInvoiceId = erpInvoiceName;
        await sale.save();
        await ErpSyncSetter.markSynced(invoiceSyncLog.id, erpInvoiceName);
        if (Number(sale.paidAmount) > 0) {
          const paymentSyncLog = await ErpSyncSetter.createLog({
            localTransactionId: String(sale.id),
            transactionType: "PAYMENT_ENTRY_SYNC",
            erpnextDocumentType: "Payment Entry",
            syncStatus: "PROCESSING"
          });
          try {
            const localPayment = await PaymentSetter.createPayment({
              paymentType: "CUSTOMER_PAYMENT",
              referenceType: "SALE",
              referenceId: sale.id,
              partyType: "CUSTOMER",
              partyId: sale.customerId || 1,
              amount: Number(sale.paidAmount),
              paymentMethod: sale.paymentMethod,
              transactionReference: sale.invoiceNumber,
              notes: `Payment for Sale #${sale.invoiceNumber}`
            });
            const paymentResult = await ErpPaymentEntryService.createAndSubmitCustomerPayment({
              customerName: erpCustomerName,
              amount: Number(sale.paidAmount),
              paymentMethod: sale.paymentMethod,
              invoiceName: erpInvoiceName,
              referenceNumber: sale.invoiceNumber,
              remarks: `Payment for Sale Invoice ${sale.invoiceNumber}`
            });
            erpPaymentName = paymentResult.paymentName;
            sale.erpnextPaymentId = erpPaymentName;
            await sale.save();
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
      const refreshedSale = await SaleGetter.fetchById(sale.id);
      res.status(201).json({
        success: true,
        message: "Sale transaction recorded successfully.",
        data: refreshedSale,
        erpSync: {
          invoice: {
            status: erpInvoiceName ? "SYNCED" : "FAILED",
            erpnextInvoiceId: erpInvoiceName,
            error: erpInvoiceError
          },
          payment: {
            status: erpPaymentName ? "SYNCED" : Number(sale.paidAmount) > 0 ? erpPaymentError ? "FAILED" : "SKIPPED" : "SKIPPED",
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
   * Manual / Retry ERPNext Sync for a specific Sale.
   */
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid sale ID" });
        return;
      }
      const sale = await SaleGetter.fetchById(id);
      if (!sale) {
        res.status(404).json({ success: false, message: `Sale ${id} not found` });
        return;
      }
      const erpCustomerName = await SaleController.resolveErpCustomer(sale.customerId, sale.customerName);
      if (!sale.erpnextInvoiceId) {
        const invoiceItems = [];
        for (const item of sale.items || []) {
          const itemCode = item.product?.erpnextItemCode || item.sku;
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName
          });
        }
        const invoiceResult = await ErpSalesInvoiceService.createAndSubmitInvoice({
          customerName: erpCustomerName,
          items: invoiceItems,
          remarks: `Sale Invoice #${sale.invoiceNumber}`
        });
        sale.erpnextInvoiceId = invoiceResult.invoiceName;
        await sale.save();
      }
      if (!sale.erpnextPaymentId && Number(sale.paidAmount) > 0 && sale.erpnextInvoiceId) {
        const paymentResult = await ErpPaymentEntryService.createAndSubmitCustomerPayment({
          customerName: erpCustomerName,
          amount: Number(sale.paidAmount),
          paymentMethod: sale.paymentMethod,
          invoiceName: sale.erpnextInvoiceId,
          referenceNumber: sale.invoiceNumber,
          remarks: `Payment for Sale Invoice ${sale.invoiceNumber}`
        });
        sale.erpnextPaymentId = paymentResult.paymentName;
        await sale.save();
      }
      const refreshed = await SaleGetter.fetchById(sale.id);
      res.status(200).json({
        success: true,
        message: "Sale successfully synced to ERPNext.",
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
        res.status(400).json({ success: false, message: "Invalid sale ID" });
        return;
      }
      await SaleSetter.deleteSale(id);
      res.status(200).json({
        success: true,
        message: `Sale with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  SaleController,
};
