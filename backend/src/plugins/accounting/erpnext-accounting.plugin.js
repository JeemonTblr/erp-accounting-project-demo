"use strict";

/**
 * ERPNext Accounting Plugin
 * Thin wrapper that delegates all calls to the existing ErpReportsService.
 * Zero duplication — existing logic is fully preserved.
 */

const { ErpReportsService } = require("../../helpers/erpnext/reports.service");

class ErpNextAccountingPlugin {
  get name() { return "ERPNext Accounting Module"; }
  get source() { return "ERPNext Accounting Module"; }
  get baseUrl() { return process.env.ERPNEXT_BASE_URL || "http://127.0.0.1:8000"; }

  async ping() {
    try {
      const { erpNextClient } = require("../../helpers/erpnext/erpnext.service");
      const res = await erpNextClient.get(
        "/api/method/frappe.auth.get_logged_user",
        { timeout: 4000 }
      );
      return { online: true, user: res.data?.message, url: this.baseUrl };
    } catch (err) {
      return { online: false, error: err.message, url: this.baseUrl };
    }
  }

  async getProfitAndLoss(options)        { return ErpReportsService.getProfitAndLoss(options); }
  async getBalanceSheet(options)         { return ErpReportsService.getBalanceSheet(options); }
  async getTrialBalance(options)         { return ErpReportsService.getTrialBalance(options); }
  async getGeneralLedger(options)        { return ErpReportsService.getGeneralLedger(options); }
  async getAccountsReceivable(options)   { return ErpReportsService.getAccountsReceivable(options); }
  async getAccountsPayable(options)      { return ErpReportsService.getAccountsPayable(options); }
  async getStockBalanceReport(options)   { return ErpReportsService.getStockBalanceReport(options); }
  async getDashboardFinancialMetrics()   { return ErpReportsService.getDashboardMetrics(); }

  // Sync methods return null so the original controller handles ERPNext sync itself
  async syncSale()     { return null; }
  async syncPurchase() { return null; }
  async syncExpense()  { return null; }
}

module.exports = { ErpNextAccountingPlugin };

