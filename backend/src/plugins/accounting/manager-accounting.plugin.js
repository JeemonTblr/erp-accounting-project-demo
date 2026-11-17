"use strict";

/**
 * EAccounting Plugin — Manager's Accounting Module
 * Communicates with the EAccounting REST API server.
 *
 * Base URL is configured via EACCOUNTING_BASE_URL in .env
 * Switch is controlled by ERP_Accounting=False in .env
 */

const axios = require("axios");

const BASE_URL = process.env.EACCOUNTING_BASE_URL || "http://localhost:5001";
const TENANT_ID = process.env.EACCOUNTING_TENANT_ID || "tenant-demo-01";
const HOST_APP_ID = process.env.EACCOUNTING_HOST_APP_ID || "textile-erp";
const TIMEOUT = parseInt(process.env.EACCOUNTING_TIMEOUT || "10000", 10);

// Axios client pre-configured with plugin identity headers
const eaccClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "x-tenant-id": TENANT_ID,
    "x-host-app-id": HOST_APP_ID,
    "x-role": "admin",
  },
});

// Inject per-request user identity if available
function getHeaders(userId) {
  return userId ? { "x-user-id": String(userId) } : {};
}

// ─── Normalize Helpers ────────────────────────────────────────────────────────
// Convert EAccounting's flat {data:{...}} envelope into the
// columns/result shape that existing controllers expect.

function normalizePnL(raw) {
  const d = raw?.data || {};
  return {
    columns: ["account", "amount"],
    result: [
      { account: "Total Income",    amount: d.income       || 0 },
      { account: "Total Expenses",  amount: d.expenses     || 0 },
      { account: "Gross Profit",    amount: d.grossProfit  || 0 },
      { account: "Net Profit",      amount: d.netProfit    || 0 },
    ],
    _raw: d,
  };
}

function normalizeBalanceSheet(raw) {
  const d = raw?.data || {};
  return {
    columns: ["account", "amount"],
    result: [
      { account: "Total Assets",      amount: d.assets      || 0 },
      { account: "Total Liabilities", amount: d.liabilities || 0 },
      { account: "Equity",            amount: d.equity      || 0 },
      { account: "Cash",              amount: d.cash        || 0 },
      { account: "Bank",              amount: d.bank        || 0 },
      { account: "Receivables",       amount: d.receivables || 0 },
      { account: "Payables",          amount: d.payables    || 0 },
    ],
    _raw: d,
  };
}

function normalizeTrialBalance(raw) {
  const rows = Array.isArray(raw?.data) ? raw.data : [];
  return {
    columns: ["account", "debit", "credit", "balance"],
    result: rows.map((r) => ({
      account: r.account || "",
      debit:   r.debit   || 0,
      credit:  r.credit  || 0,
      balance: (r.debit || 0) - (r.credit || 0),
    })),
  };
}

function normalizeGeneralLedger(raw) {
  const rows = Array.isArray(raw?.data) ? raw.data : [];
  return {
    columns: ["date", "account", "debit", "credit", "remarks"],
    result: rows.map((r) => ({
      date:    r.date    || r.posting_date || "",
      account: r.account || "",
      debit:   r.debit   || 0,
      credit:  r.credit  || 0,
      remarks: r.remarks || r.narration || "",
    })),
  };
}

function normalizeOutstanding(raw) {
  const rows = Array.isArray(raw?.data) ? raw.data : [];
  return {
    columns: ["party", "outstanding_amount", "overdue_amount", "status"],
    result: rows.map((r) => ({
      party:              r.name   || r.id   || "",
      outstanding_amount: r.amount || 0,
      overdue_amount:     r.overdue || 0,
      status:             r.status || "OPEN",
    })),
  };
}

// ─── EAccounting Plugin Class ─────────────────────────────────────────────────

class ManagerAccountingPlugin {
  get name() { return "EAccounting Module"; }
  get source() { return "EAccounting Module (Manager)"; }
  get baseUrl() { return BASE_URL; }

  /** Health ping */
  async ping() {
    try {
      const res = await eaccClient.get("/api/health", { timeout: 4000 });
      return { online: true, status: res.data?.status || "ok", url: BASE_URL };
    } catch (err) {
      return { online: false, error: err.message, url: BASE_URL };
    }
  }

  /** List available modules */
  async getModules() {
    const res = await eaccClient.get("/api/modules");
    return res.data?.modules || [];
  }

  /** Foundation / tenant config */
  async getFoundationConfig() {
    const res = await eaccClient.get("/api/foundation/config");
    return res.data?.data || res.data;
  }

  // ─── Report Methods ──────────────────────────────────────────────────────

  async getProfitAndLoss(options = {}) {
    const res = await eaccClient.get("/api/profit-loss/summary", { params: options });
    return normalizePnL(res.data);
  }

  async getBalanceSheet(options = {}) {
    const res = await eaccClient.get("/api/balance-sheet/summary", { params: options });
    return normalizeBalanceSheet(res.data);
  }

  async getTrialBalance(options = {}) {
    const res = await eaccClient.get("/api/reports/trial-balance", { params: options });
    return normalizeTrialBalance(res.data);
  }

  async getGeneralLedger(options = {}) {
    const res = await eaccClient.get("/api/reports/day-book", { params: options });
    return normalizeGeneralLedger(res.data);
  }

  async getAccountsReceivable(options = {}) {
    const res = await eaccClient.get("/api/outstanding/customers", { params: options });
    return normalizeOutstanding(res.data);
  }

  async getAccountsPayable(options = {}) {
    const res = await eaccClient.get("/api/outstanding/suppliers", { params: options });
    return normalizeOutstanding(res.data);
  }

  async getStockBalanceReport(options = {}) {
    // EAccounting does not currently expose a stock balance endpoint.
    // Returns an empty normalized result so existing controllers don't break.
    return {
      columns: ["item_code", "warehouse", "opening_qty", "in_qty", "out_qty", "bal_qty"],
      result: [],
      _note: "Stock balance not available from EAccounting module.",
    };
  }

  // ─── Dashboard Metrics ───────────────────────────────────────────────────

  async getDashboardFinancialMetrics() {
    const [cashBank, pnl, receivables, payables, charts, dayBook] = await Promise.allSettled([
      eaccClient.get("/api/cash-bank/summary"),
      eaccClient.get("/api/profit-loss/summary"),
      eaccClient.get("/api/outstanding/customers"),
      eaccClient.get("/api/outstanding/suppliers"),
      eaccClient.get("/api/reports/charts"),
      eaccClient.get("/api/reports/day-book"),
    ]);

    const cb   = cashBank.status    === "fulfilled" ? (cashBank.value.data?.data    || {}) : {};
    const pl   = pnl.status         === "fulfilled" ? (pnl.value.data?.data         || {}) : {};
    const rec  = receivables.status === "fulfilled" ? (receivables.value.data?.data || []) : [];
    const pay  = payables.status    === "fulfilled" ? (payables.value.data?.data    || []) : [];
    const ch   = charts.status      === "fulfilled" ? (charts.value.data?.data      || []) : [];
    const dbk  = dayBook.status     === "fulfilled" ? (dayBook.value.data?.data     || []) : [];

    const customerOutstanding = Array.isArray(rec)
      ? rec.reduce((sum, r) => sum + (r.amount || 0), 0)
      : 0;
    const supplierOutstanding = Array.isArray(pay)
      ? pay.reduce((sum, r) => sum + (r.amount || 0), 0)
      : 0;

    return {
      cashBalance:          cb.cashBalance   || cb.cash   || 0,
      bankBalance:          cb.bankBalance   || cb.bank   || 0,
      upiBalance:           cb.upiBalance    || 0,
      totalRevenue:         pl.income        || 0,
      totalExpenses:        pl.expenses      || 0,
      netProfitLoss:        pl.netProfit     || 0,
      grossProfit:          pl.grossProfit   || 0,
      varianceVsLastMonth:  pl.varianceVsLastMonth || 0,
      customerOutstanding,
      supplierOutstanding,
      monthlyCharts:        ch,
      recentDayBook:        dbk.slice(0, 5),
      source:               "EAccounting Module (Manager)",
      asOf:                 new Date().toISOString(),
    };
  }

  // ─── Sync Methods ────────────────────────────────────────────────────────
  // These POST transaction data from your ERP into EAccounting.
  // EAccounting currently has GET-only endpoints; when manager adds POST routes,
  // these will sync automatically — no code change needed here.

  async syncSale(sale, fullSale) {
    const payload = {
      external_id:    `SALE-${sale.id}`,
      tenant_id:      TENANT_ID,
      customer_name:  sale.customerName || "Walk-in Customer",
      invoice_date:   sale.saleDate
        ? new Date(sale.saleDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      due_date:       sale.saleDate
        ? new Date(sale.saleDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      payment_method: sale.paymentMethod || "CASH",
      payment_status: sale.paymentStatus || "PAID",
      items: (fullSale?.items || []).map((item) => ({
        description: item.itemName || item.sku,
        qty:         Number(item.quantity),
        rate:        Number(item.unitPrice),
        amount:      Number(item.quantity) * Number(item.unitPrice),
      })),
      subtotal:    Number(sale.subTotal    || 0),
      discount:    Number(sale.discountAmount || 0),
      grand_total: Number(sale.grandTotal  || 0),
      paid_amount: Number(sale.paidAmount  || 0),
    };

    try {
      const res = await eaccClient.post("/api/daily-income/invoices", payload);
      return { success: true, eaccDocId: `EACC-INV-${sale.id}`, data: res.data };
    } catch (err) {
      // POST endpoint may not exist yet — log gracefully
      return {
        success: false,
        eaccDocId: `EACC-INV-${sale.id}`,
        error: err.response?.status === 404
          ? "EAccounting POST /api/daily-income/invoices not yet available"
          : err.message,
      };
    }
  }

  async syncPurchase(purchase, fullPurchase) {
    const payload = {
      external_id:    `PUR-${purchase.id}`,
      tenant_id:      TENANT_ID,
      supplier_name:  fullPurchase?.supplier?.name || "Unknown Supplier",
      bill_date:      purchase.purchaseDate
        ? new Date(purchase.purchaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      payment_method: purchase.paymentMethod || "BANK",
      payment_status: purchase.paymentStatus || "PAID",
      items: (fullPurchase?.items || []).map((item) => ({
        description: item.itemName || item.sku,
        qty:         Number(item.quantity),
        rate:        Number(item.unitPrice),
        amount:      Number(item.quantity) * Number(item.unitPrice),
      })),
      grand_total: Number(purchase.grandTotal || 0),
      paid_amount: Number(purchase.paidAmount || 0),
    };

    try {
      const res = await eaccClient.post("/api/purchase-management/bills", payload);
      return { success: true, eaccDocId: `EACC-BILL-${purchase.id}`, data: res.data };
    } catch (err) {
      return {
        success: false,
        eaccDocId: `EACC-BILL-${purchase.id}`,
        error: err.response?.status === 404
          ? "EAccounting POST /api/purchase-management/bills not yet available"
          : err.message,
      };
    }
  }

  async syncExpense(expense) {
    const payload = {
      external_id:    `EXP-${expense.id}`,
      tenant_id:      TENANT_ID,
      title:          expense.title,
      category:       expense.category,
      amount:         Number(expense.amount),
      expense_date:   expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      payment_method: expense.paymentMethod || "CASH",
      description:    expense.description || "",
    };

    try {
      const res = await eaccClient.post("/api/daily-expenses/entries", payload);
      return { success: true, eaccDocId: `EACC-EXP-${expense.id}`, data: res.data };
    } catch (err) {
      return {
        success: false,
        eaccDocId: `EACC-EXP-${expense.id}`,
        error: err.response?.status === 404
          ? "EAccounting POST /api/daily-expenses/entries not yet available"
          : err.message,
      };
    }
  }
}

module.exports = { ManagerAccountingPlugin };

