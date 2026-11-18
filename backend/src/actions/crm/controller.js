"use strict";

const { CrmService } = require("./service");
const {
  Customer,
  Supplier,
  Product,
  Sale,
  Purchase,
  Expense,
  Payment,
  ErpSyncLog,
} = require("../../models");

class CrmController {
  // ─── 3.1 Tenant / Company ──────────────────────────────────────────────────
  static async getCompany(req, res, next) {
    try {
      const data = CrmService.getCompanyData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.2 Customers ─────────────────────────────────────────────────────────
  static async getCustomers(req, res, next) {
    try {
      const data = await CrmService.getCustomersData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.3 Suppliers ─────────────────────────────────────────────────────────
  static async getSuppliers(req, res, next) {
    try {
      const data = await CrmService.getSuppliersData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.4 Products Catalog ──────────────────────────────────────────────────
  static async getProducts(req, res, next) {
    try {
      const data = await CrmService.getProductsData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.5 Invoices ──────────────────────────────────────────────────────────
  static async getInvoices(req, res, next) {
    try {
      const data = await CrmService.getInvoicesData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.6 Receipts ──────────────────────────────────────────────────────────
  static async getReceipts(req, res, next) {
    try {
      const data = await CrmService.getReceiptsData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.7 Expenses ──────────────────────────────────────────────────────────
  static async getExpenses(req, res, next) {
    try {
      const data = await CrmService.getExpensesData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.8 Bills (Purchases) ─────────────────────────────────────────────────
  static async getBills(req, res, next) {
    try {
      const data = await CrmService.getBillsData();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.9 Outstanding & Aging ───────────────────────────────────────────────
  static async getOutstanding(req, res, next) {
    try {
      const data = await CrmService.getOutstandingData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 3.10 Accounting Mapping ───────────────────────────────────────────────
  static async getAccountMapping(req, res, next) {
    try {
      const data = CrmService.getAccountMappingData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── Complete All-in-One CRM Bundle ─────────────────────────────────────────
  static async getAll(req, res, next) {
    try {
      const data = await CrmService.getAllCrmData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  // ─── 6. Sync Endpoints (Create & Sync or Push to EAccounting) ───────────────

  /**
   * POST /api/crm/customers/sync
   */
  static async syncCustomer(req, res, next) {
    try {
      let payload = req.body;
      let customer;

      // If client sent raw customer info to create in MariaDB
      if (payload.customer_name || payload.name) {
        const name = payload.customer_name || payload.name;
        customer = await Customer.create({
          name,
          email: payload.email || null,
          phone: payload.phone || null,
          address: payload.billing_address || payload.address || null,
          gstin: payload.gst_vat_no || payload.gstin || null,
          customerType: payload.customer_type || "Retail",
        });
        payload = {
          customer_id: `CUST-${customer.id}`,
          external_customer_id: `crm_cust_${customer.id}`,
          customer_name: customer.name,
          email: customer.email || "support@textileshop.com",
          phone: customer.phone || "+91-9876543210",
          billing_address: customer.address || "Main Street, Kerala",
          shipping_address: customer.address || "Main Street, Kerala",
          gst_vat_no: customer.gstin || "N/A",
          credit_limit: 50000,
          payment_terms: "Net 30",
          customer_status: "active",
          account_code: "1201",
        };
      }

      const externalId = payload.external_customer_id || `crm_cust_${payload.customer_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("customers", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Customer synced to EAccounting" : syncResult.error,
        localCustomer: customer || null,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/suppliers/sync
   */
  static async syncSupplier(req, res, next) {
    try {
      let payload = req.body;
      let supplier;

      if (payload.supplier_name || payload.name) {
        const name = payload.supplier_name || payload.name;
        supplier = await Supplier.create({
          name,
          email: payload.email || null,
          phone: payload.phone || null,
          address: payload.address || null,
          gstin: payload.gst_vat_no || payload.gstin || null,
          supplierType: payload.supplier_type || "Wholesaler",
        });
        payload = {
          supplier_id: `SUP-${supplier.id}`,
          external_supplier_id: `crm_sup_${supplier.id}`,
          supplier_name: supplier.name,
          email: supplier.email || "orders@supplier.com",
          phone: supplier.phone || "+91-9845012345",
          address: supplier.address || "Industrial Estate",
          gst_vat_no: supplier.gstin || "N/A",
          payment_terms: "Net 45",
          credit_limit: 100000,
          account_code: "2101",
          status: "active",
        };
      }

      const externalId = payload.external_supplier_id || `crm_sup_${payload.supplier_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("suppliers", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Supplier synced to EAccounting" : syncResult.error,
        localSupplier: supplier || null,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/products/sync
   */
  static async syncProduct(req, res, next) {
    try {
      let payload = req.body;
      let product;

      if (payload.product_name || payload.name) {
        const name = payload.product_name || payload.name;
        const sku = payload.sku || `SKU-${Date.now().toString().slice(-6)}`;
        product = await Product.create({
          name,
          sku,
          categoryId: payload.category_id || 1,
          purchasePrice: payload.standard_cost || payload.purchase_price || 0,
          sellingPrice: payload.sales_price || payload.selling_price || 0,
          gstRate: payload.gst_rate || 5,
          stockQuantity: payload.stock_quantity || 10,
        });
        payload = {
          product_id: `PROD-${product.id}`,
          external_product_id: `crm_prod_${product.id}`,
          product_name: product.name,
          category: payload.category || "Garments",
          sku: product.sku,
          standard_cost: Number(product.purchasePrice),
          sales_price: Number(product.sellingPrice),
          tax_code: `GST-${Number(product.gstRate)}`,
          account_code: "4001",
          unit_of_measure: "pcs",
          status: "active",
        };
      }

      const externalId = payload.external_product_id || `crm_prod_${payload.product_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("products", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Product synced to EAccounting" : syncResult.error,
        localProduct: product || null,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/invoices/sync
   */
  static async syncInvoice(req, res, next) {
    try {
      const payload = req.body;
      const externalId = payload.external_invoice_id || `crm_inv_${payload.invoice_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("invoices", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Invoice synced to EAccounting" : syncResult.error,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/receipts/sync
   */
  static async syncReceipt(req, res, next) {
    try {
      const payload = req.body;
      const externalId = payload.external_payment_id || `crm_rcpt_${payload.payment_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("receipts", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Receipt synced to EAccounting" : syncResult.error,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/expenses/sync
   */
  static async syncExpense(req, res, next) {
    try {
      const payload = req.body;
      const externalId = payload.external_expense_id || `crm_exp_${payload.expense_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("expenses", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Expense synced to EAccounting" : syncResult.error,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/bills/sync
   */
  static async syncBill(req, res, next) {
    try {
      const payload = req.body;
      const externalId = payload.external_bill_id || `crm_bill_${payload.bill_id || Date.now()}`;
      const syncResult = await CrmService.syncEntity("bills", externalId, payload);

      res.status(200).json({
        success: syncResult.success,
        message: syncResult.success ? "Bill synced to EAccounting" : syncResult.error,
        syncResult,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/crm/sync-all
   * One-Click Batch Sync of All Operational CRM Data to EAccounting
   */
  static async syncAll(req, res, next) {
    try {
      const result = await CrmService.syncAllToEaccounting();
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/crm/sync-status
   */
  static async getSyncStatus(req, res, next) {
    try {
      const recentLogs = await ErpSyncLog.findAll({
        where: { transactionType: "CRM_SYNC" },
        order: [["id", "DESC"]],
        limit: 20,
      });

      const [totalCount, successCount, failedCount] = await Promise.all([
        ErpSyncLog.count({ where: { transactionType: "CRM_SYNC" } }),
        ErpSyncLog.count({ where: { transactionType: "CRM_SYNC", syncStatus: "SYNCED" } }),
        ErpSyncLog.count({ where: { transactionType: "CRM_SYNC", syncStatus: "FAILED" } }),
      ]);

      res.status(200).json({
        success: true,
        summary: {
          totalSyncs: totalCount,
          successful: successCount,
          failed: failedCount,
        },
        recentLogs,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = { CrmController };

