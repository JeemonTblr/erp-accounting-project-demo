"use strict";

const axios = require("axios");
const { Op } = require("sequelize");
const {
  Customer,
  Supplier,
  Product,
  Category,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  Expense,
  Payment,
  ErpSyncLog,
} = require("../../models");
const { ErpSyncSetter } = require("../erp-sync/setter");

const EACCOUNTING_BASE_URL = process.env.EACCOUNTING_BASE_URL || "http://localhost:5001";
const TENANT_ID = process.env.EACCOUNTING_TENANT_ID || "tenant-demo-01";
const HOST_APP_ID = process.env.EACCOUNTING_HOST_APP_ID || "textile-erp";

const eaccClient = axios.create({
  baseURL: EACCOUNTING_BASE_URL,
  timeout: 10000,
  headers: {
    "x-tenant-id": TENANT_ID,
    "x-host-app-id": HOST_APP_ID,
    "x-role": "admin",
    "Content-Type": "application/json",
  },
});

class CrmService {
  /**
   * 3.1 Tenant / Company Profile
   */
  static getCompanyData() {
    return {
      tenant_id: TENANT_ID,
      company_name: "Modern Textiles & Garments Shop",
      company_code: "TEX-ERP",
      currency: "INR",
      timezone: "Asia/Kolkata",
      fiscal_year_start: "2026-04-01",
      tax_registration_no: "32AAACA1234A1Z5",
      country: "IN",
      address: "42 Textile Hub, Tirupur & Showroom Kochi, Kerala",
      status: "active",
    };
  }

  /**
   * 3.2 Customer / Client Data
   */
  static async getCustomersData() {
    const customers = await Customer.findAll({ order: [["id", "ASC"]] });
    return customers.map((c) => ({
      customer_id: `CUST-${c.id}`,
      external_customer_id: `crm_cust_${c.id}`,
      customer_name: c.name,
      email: c.email || "customer@textileshop.com",
      phone: c.phone || "+91-9876543210",
      billing_address: c.address || "Main Street, Kerala, India",
      shipping_address: c.address || "Main Street, Kerala, India",
      gst_vat_no: c.gstin || "URP",
      credit_limit: 50000,
      payment_terms: "Net 30",
      customer_status: c.isActive ? "active" : "inactive",
      account_code: "1201",
      raw_id: c.id,
    }));
  }

  /**
   * 3.3 Supplier / Vendor Data
   */
  static async getSuppliersData() {
    const suppliers = await Supplier.findAll({ order: [["id", "ASC"]] });
    return suppliers.map((s) => ({
      supplier_id: `SUP-${s.id}`,
      external_supplier_id: `crm_sup_${s.id}`,
      supplier_name: s.name,
      email: s.email || "orders@textilesupplier.com",
      phone: s.phone || "+91-9845012345",
      address: s.address || "Industrial Estate, Tamil Nadu",
      gst_vat_no: s.gstin || "URP",
      payment_terms: s.supplierType === "Manufacturer" ? "Net 45" : "Net 30",
      credit_limit: 150000,
      account_code: "2101",
      status: s.isActive ? "active" : "inactive",
      raw_id: s.id,
    }));
  }

  /**
   * 3.4 Product / Service Catalog
   */
  static async getProductsData() {
    const products = await Product.findAll({
      include: [{ model: Category, as: "category" }],
      order: [["id", "ASC"]],
    });
    return products.map((p) => ({
      product_id: `PROD-${p.id}`,
      external_product_id: `crm_prod_${p.id}`,
      product_name: p.name,
      category: p.category?.name || "Garments",
      sku: p.sku,
      standard_cost: Number(p.purchasePrice || 0),
      sales_price: Number(p.sellingPrice || 0),
      tax_code: `GST-${Number(p.gstRate || 5)}`,
      account_code: "4001",
      unit_of_measure: "pcs",
      status: p.isActive ? "active" : "inactive",
      stock_quantity: Number(p.stockQuantity || 0),
      raw_id: p.id,
    }));
  }

  /**
   * 3.5 Invoice / Sales Document Data
   */
  static async getInvoicesData() {
    const sales = await Sale.findAll({
      include: [
        { model: Customer, as: "customer" },
        { model: SaleItem, as: "items", include: [{ model: Product, as: "product" }] },
      ],
      order: [["id", "DESC"]],
    });

    return sales.map((s) => {
      const invDate = s.saleDate
        ? new Date(s.saleDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const dueDate = s.saleDate
        ? new Date(new Date(s.saleDate).getTime() + 15 * 86400000).toISOString().split("T")[0]
        : invDate;

      return {
        invoice_id: `INV-${s.id}`,
        external_invoice_id: `crm_inv_${s.id}`,
        customer_id: s.customerId ? `CUST-${s.customerId}` : "CUST-WALKIN",
        customer_name: s.customerName || s.customer?.name || "Walk-in Retail Customer",
        invoice_date: invDate,
        due_date: dueDate,
        order_reference: s.invoiceNumber,
        status: s.paymentStatus === "PAID" ? "posted" : "unpaid",
        subtotal: Number(s.subTotal || 0),
        discount: Number(s.discountAmount || 0),
        tax_amount: Number(s.taxAmount || 0),
        total_amount: Number(s.grandTotal || 0),
        paid_amount: Number(s.paidAmount || 0),
        currency: "INR",
        notes: s.notes || "Store counter sale",
        payment_method: s.paymentMethod || "CASH",
        line_items: (s.items || []).map((item) => ({
          product_id: `PROD-${item.productId}`,
          description: item.itemName || item.product?.name || item.sku,
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          tax_code: `GST-${Number(item.taxRate || 5)}`,
          amount: Number(item.totalAmount),
          account_code: "4001",
        })),
        raw_id: s.id,
      };
    });
  }

  /**
   * 3.6 Payment / Receipt Data
   */
  static async getReceiptsData() {
    const payments = await Payment.findAll({
      where: {
        [Op.or]: [{ partyType: "CUSTOMER" }, { referenceType: "SALE" }],
      },
      order: [["id", "DESC"]],
    });

    return payments.map((p) => {
      const pDate = p.paymentDate
        ? new Date(p.paymentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      return {
        payment_id: `RCPT-${p.id}`,
        external_payment_id: `crm_rcpt_${p.id}`,
        customer_id: p.partyId ? `CUST-${p.partyId}` : "CUST-1",
        invoice_id: p.referenceId ? `INV-${p.referenceId}` : `INV-REF-${p.id}`,
        payment_date: pDate,
        amount: Number(p.amount),
        currency: "INR",
        payment_method: (p.paymentMethod || "CASH").toLowerCase(),
        reference_no: p.transactionReference || p.paymentNumber,
        bank_account_id: p.paymentMethod === "BANK" ? "BANK-101" : "CASH-101",
        status: "posted",
        raw_id: p.id,
      };
    });
  }

  /**
   * 3.7 Expense / Bill Data
   */
  static async getExpensesData() {
    const expenses = await Expense.findAll({ order: [["id", "DESC"]] });
    return expenses.map((e) => {
      const eDate = e.expenseDate
        ? new Date(e.expenseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      return {
        expense_id: `EXP-${e.id}`,
        external_expense_id: `crm_exp_${e.id}`,
        supplier_id: "SUP-GEN",
        category_id: `CAT-${(e.category || "General").toUpperCase()}`,
        category_name: e.category || "General",
        expense_date: eDate,
        description: e.title || e.description || "Operational Expense",
        amount: Number(e.amount),
        tax_amount: 0,
        total_amount: Number(e.amount),
        currency: "INR",
        payment_method: e.paymentMethod || "CASH",
        account_code: "5001",
        status: "posted",
        raw_id: e.id,
      };
    });
  }

  /**
   * 3.8 Purchase Bill Data
   */
  static async getBillsData() {
    const purchases = await Purchase.findAll({
      include: [
        { model: Supplier, as: "supplier" },
        { model: PurchaseItem, as: "items", include: [{ model: Product, as: "product" }] },
      ],
      order: [["id", "DESC"]],
    });

    return purchases.map((pur) => {
      const bDate = pur.purchaseDate
        ? new Date(pur.purchaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const dueDate = pur.purchaseDate
        ? new Date(new Date(pur.purchaseDate).getTime() + 30 * 86400000).toISOString().split("T")[0]
        : bDate;

      return {
        bill_id: `BILL-${pur.id}`,
        external_bill_id: `crm_bill_${pur.id}`,
        supplier_id: `SUP-${pur.supplierId}`,
        supplier_name: pur.supplier?.name || "Direct Supplier",
        bill_date: bDate,
        due_date: dueDate,
        subtotal: Number(pur.subTotal || 0),
        tax_amount: Number(pur.taxAmount || 0),
        total_amount: Number(pur.grandTotal || 0),
        paid_amount: Number(pur.paidAmount || 0),
        currency: "INR",
        status: pur.paymentStatus === "PAID" ? "posted" : "unpaid",
        payment_method: pur.paymentMethod || "BANK",
        line_items: (pur.items || []).map((item) => ({
          product_id: `PROD-${item.productId}`,
          description: item.product?.name || item.itemName || "Stock Item",
          quantity: Number(item.quantity),
          unit_price: Number(item.unitPrice),
          tax_code: "GST-5",
          amount: Number(item.totalAmount),
          account_code: "6101",
        })),
        raw_id: pur.id,
      };
    });
  }

  /**
   * 3.9 Outstanding Balance Data
   */
  static async getOutstandingData() {
    // 1. Customer Outstanding
    const unpaidSales = await Sale.findAll({
      where: { paymentStatus: { [Op.ne]: "PAID" } },
      include: [{ model: Customer, as: "customer" }],
    });

    const customerMap = {};
    const now = Date.now();

    for (const s of unpaidSales) {
      const cId = s.customerId ? `CUST-${s.customerId}` : "CUST-WALKIN";
      const due = Number(s.grandTotal || 0) - Number(s.paidAmount || 0);
      if (due <= 0) continue;

      const saleDate = s.saleDate ? new Date(s.saleDate).getTime() : now;
      const overdueDays = Math.max(0, Math.floor((now - saleDate) / 86400000));

      let agingBucket = "0-30 days";
      if (overdueDays > 60) agingBucket = "60+ days";
      else if (overdueDays > 30) agingBucket = "30-60 days";

      if (!customerMap[cId]) {
        customerMap[cId] = {
          customer_id: cId,
          customer_name: s.customer?.name || s.customerName || "Customer",
          open_balance: 0,
          overdue_days: overdueDays,
          aging_bucket: agingBucket,
          total_due: 0,
          last_invoice_date: s.saleDate ? new Date(s.saleDate).toISOString().split("T")[0] : null,
          status: "active",
        };
      }
      customerMap[cId].open_balance += due;
      customerMap[cId].total_due += due;
      customerMap[cId].overdue_days = Math.max(customerMap[cId].overdue_days, overdueDays);
    }

    // 2. Supplier Outstanding
    const unpaidPurchases = await Purchase.findAll({
      where: { paymentStatus: { [Op.ne]: "PAID" } },
      include: [{ model: Supplier, as: "supplier" }],
    });

    const supplierMap = {};
    for (const pur of unpaidPurchases) {
      const sId = `SUP-${pur.supplierId}`;
      const due = Number(pur.grandTotal || 0) - Number(pur.paidAmount || 0);
      if (due <= 0) continue;

      const purDate = pur.purchaseDate ? new Date(pur.purchaseDate).getTime() : now;
      const overdueDays = Math.max(0, Math.floor((now - purDate) / 86400000));

      let agingBucket = "0-30 days";
      if (overdueDays > 60) agingBucket = "60+ days";
      else if (overdueDays > 30) agingBucket = "30-60 days";

      if (!supplierMap[sId]) {
        supplierMap[sId] = {
          supplier_id: sId,
          supplier_name: pur.supplier?.name || "Supplier",
          open_balance: 0,
          overdue_days: overdueDays,
          aging_bucket: agingBucket,
          total_due: 0,
          last_bill_date: pur.purchaseDate ? new Date(pur.purchaseDate).toISOString().split("T")[0] : null,
          status: "active",
        };
      }
      supplierMap[sId].open_balance += due;
      supplierMap[sId].total_due += due;
    }

    return {
      customers: Object.values(customerMap),
      suppliers: Object.values(supplierMap),
      as_of: new Date().toISOString(),
    };
  }

  /**
   * 3.10 Revenue / Accounting Mapping
   */
  static getAccountMappingData() {
    return {
      revenue_account_code: "4001",
      expense_account_code: "5001",
      tax_account_code: "2201",
      cash_account_code: "1001",
      receivables_account_code: "1201",
      payables_account_code: "2101",
      inventory_account_code: "6101",
    };
  }

  /**
   * Full Combined CRM Data Object
   */
  static async getAllCrmData() {
    const [company, customers, suppliers, products, invoices, receipts, expenses, bills, outstanding] =
      await Promise.all([
        Promise.resolve(CrmService.getCompanyData()),
        CrmService.getCustomersData(),
        CrmService.getSuppliersData(),
        CrmService.getProductsData(),
        CrmService.getInvoicesData(),
        CrmService.getReceiptsData(),
        CrmService.getExpensesData(),
        CrmService.getBillsData(),
        CrmService.getOutstandingData(),
      ]);

    return {
      company,
      customers,
      suppliers,
      products,
      invoices,
      receipts,
      expenses,
      bills,
      outstanding,
      account_mapping: CrmService.getAccountMappingData(),
      extracted_at: new Date().toISOString(),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SYNC PRINTS & DISPATCH (CRM ➔ EAccounting Section 6)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generic sync dispatcher per Section 6 contract
   */
  static async syncEntity(entityType, externalId, payload) {
    const body = {
      tenant_id: TENANT_ID,
      external_id: externalId,
      entity_type: entityType,
      action: "create_or_update",
      payload,
    };

    let syncLog = null;
    try {
      syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(externalId),
        transactionType: "CRM_SYNC",
        erpnextDocumentType: `EAccounting ${entityType}`,
        syncStatus: "PROCESSING",
        payload: JSON.stringify(body),
      });

      const res = await eaccClient.post(`/api/v1/${entityType}/sync`, body);
      await ErpSyncSetter.markSynced(syncLog.id, res.data?.accounting_id || `${entityType}-${externalId}`);
      return { success: true, data: res.data };
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      if (syncLog) {
        await ErpSyncSetter.markFailed(syncLog.id, errMsg);
      }
      return { success: false, error: errMsg };
    }
  }

  /**
   * One-Click Batch Sync of All CRM Operational Data to EAccounting
   */
  static async syncAllToEaccounting() {
    const [customers, suppliers, products, invoices, receipts, expenses, bills, outstanding] =
      await Promise.all([
        CrmService.getCustomersData(),
        CrmService.getSuppliersData(),
        CrmService.getProductsData(),
        CrmService.getInvoicesData(),
        CrmService.getReceiptsData(),
        CrmService.getExpensesData(),
        CrmService.getBillsData(),
        CrmService.getOutstandingData(),
      ]);

    const results = {
      customers: 0,
      suppliers: 0,
      products: 0,
      invoices: 0,
      receipts: 0,
      expenses: 0,
      bills: 0,
      outstanding: 0,
      errors: [],
    };

    // 1. Sync Customers
    for (const c of customers) {
      const r = await CrmService.syncEntity("customers", c.external_customer_id, c);
      if (r.success) results.customers++;
      else results.errors.push(`Customer ${c.customer_name}: ${r.error}`);
    }

    // 2. Sync Suppliers
    for (const s of suppliers) {
      const r = await CrmService.syncEntity("suppliers", s.external_supplier_id, s);
      if (r.success) results.suppliers++;
      else results.errors.push(`Supplier ${s.supplier_name}: ${r.error}`);
    }

    // 3. Sync Products
    for (const p of products) {
      const r = await CrmService.syncEntity("products", p.external_product_id, p);
      if (r.success) results.products++;
      else results.errors.push(`Product ${p.product_name}: ${r.error}`);
    }

    // 4. Sync Invoices
    for (const inv of invoices) {
      const r = await CrmService.syncEntity("invoices", inv.external_invoice_id, inv);
      if (r.success) results.invoices++;
      else results.errors.push(`Invoice ${inv.invoice_id}: ${r.error}`);
    }

    // 5. Sync Receipts
    for (const rcpt of receipts) {
      const r = await CrmService.syncEntity("receipts", rcpt.external_payment_id, rcpt);
      if (r.success) results.receipts++;
      else results.errors.push(`Receipt ${rcpt.payment_id}: ${r.error}`);
    }

    // 6. Sync Expenses
    for (const exp of expenses) {
      const r = await CrmService.syncEntity("expenses", exp.external_expense_id, exp);
      if (r.success) results.expenses++;
      else results.errors.push(`Expense ${exp.expense_id}: ${r.error}`);
    }

    // 7. Sync Bills
    for (const b of bills) {
      const r = await CrmService.syncEntity("bills", b.external_bill_id, b);
      if (r.success) results.bills++;
      else results.errors.push(`Bill ${b.bill_id}: ${r.error}`);
    }

    // 8. Sync Outstanding
    const outRes = await CrmService.syncEntity("outstanding", `crm_out_${Date.now()}`, outstanding);
    if (outRes.success) results.outstanding = (outstanding.customers || []).length + (outstanding.suppliers || []).length;

    return {
      success: results.errors.length === 0,
      syncedCounts: results,
      totalSynced:
        results.customers +
        results.suppliers +
        results.products +
        results.invoices +
        results.receipts +
        results.expenses +
        results.bills,
      completedAt: new Date().toISOString(),
    };
  }
}

module.exports = { CrmService };

