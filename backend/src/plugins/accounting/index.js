"use strict";

/**
 * AccountingAdapter — The Plugin Switch
 *
 * Reads ERP_Accounting from .env at runtime (no restart needed in dev).
 *   ERP_Accounting=True  → delegates to ErpNextAccountingPlugin
 *   ERP_Accounting=False → delegates to ManagerAccountingPlugin
 *
 * All controllers import AccountingAdapter and call its methods.
 * They never import a provider directly.
 */

const fs = require("fs");
const path = require("path");
const { ErpNextAccountingPlugin }  = require("./erpnext-accounting.plugin");
const { ManagerAccountingPlugin }  = require("./manager-accounting.plugin");

const erpNextPlugin  = new ErpNextAccountingPlugin();
const managerPlugin  = new ManagerAccountingPlugin();

class AccountingAdapter {

  /** Returns true when ERPNext is the active provider. */
  static isErpAccounting() {
    try {
      const envPath = path.resolve(__dirname, "../../../.env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/^\s*ERP_Accounting\s*=\s*([^\r\n#]+)/m);
        if (match) {
          const val = match[1].trim().toLowerCase();
          return val === "true" || val === "1";
        }
      }
    } catch (e) {
      // fallback to process.env
    }
    const val = (process.env.ERP_Accounting || "true").toString().trim().toLowerCase();
    return val === "true" || val === "1";
  }

  /** Returns the currently active provider instance. */
  static getActiveProvider() {
    return AccountingAdapter.isErpAccounting() ? erpNextPlugin : managerPlugin;
  }

  /** Returns metadata about the active provider (for response labels). */
  static getActivePluginInfo() {
    const isErp = AccountingAdapter.isErpAccounting();
    const p = AccountingAdapter.getActiveProvider();
    return {
      name:            p.name,
      source:          p.source,
      baseUrl:         p.baseUrl,
      mode:            isErp ? "erpnext" : "eaccounting",
      isErpAccounting: isErp,
    };
  }

  /** Ping both providers and return combined health status. */
  static async getPluginStatus() {
    const [erpStatus, eaccStatus] = await Promise.allSettled([
      erpNextPlugin.ping(),
      managerPlugin.ping(),
    ]);
    return {
      activeMode:  AccountingAdapter.isErpAccounting() ? "ERPNext" : "EAccounting",
      erpnext:     erpStatus.status  === "fulfilled" ? erpStatus.value  : { online: false, error: erpStatus.reason?.message },
      eaccounting: eaccStatus.status === "fulfilled" ? eaccStatus.value : { online: false, error: eaccStatus.reason?.message },
    };
  }

  // ─── Report Methods (delegated to active provider) ────────────────────────

  static async getProfitAndLoss(options) {
    return AccountingAdapter.getActiveProvider().getProfitAndLoss(options);
  }

  static async getBalanceSheet(options) {
    return AccountingAdapter.getActiveProvider().getBalanceSheet(options);
  }

  static async getTrialBalance(options) {
    return AccountingAdapter.getActiveProvider().getTrialBalance(options);
  }

  static async getGeneralLedger(options) {
    return AccountingAdapter.getActiveProvider().getGeneralLedger(options);
  }

  static async getAccountsReceivable(options) {
    return AccountingAdapter.getActiveProvider().getAccountsReceivable(options);
  }

  static async getAccountsPayable(options) {
    return AccountingAdapter.getActiveProvider().getAccountsPayable(options);
  }

  static async getStockBalanceReport(options) {
    return AccountingAdapter.getActiveProvider().getStockBalanceReport(options);
  }

  static async getDashboardFinancialMetrics() {
    return AccountingAdapter.getActiveProvider().getDashboardFinancialMetrics();
  }

  // ─── Sync Methods ─────────────────────────────────────────────────────────
  // Returns null when ERPNext is active (original controller handles ERPNext sync).
  // Returns sync result when EAccounting is active.

  static async syncSale(sale, fullSale) {
    if (AccountingAdapter.isErpAccounting()) return null;
    return managerPlugin.syncSale(sale, fullSale);
  }

  static async syncPurchase(purchase, fullPurchase) {
    if (AccountingAdapter.isErpAccounting()) return null;
    return managerPlugin.syncPurchase(purchase, fullPurchase);
  }

  static async syncExpense(expense) {
    if (AccountingAdapter.isErpAccounting()) return null;
    return managerPlugin.syncExpense(expense);
  }
}

module.exports = { AccountingAdapter };

