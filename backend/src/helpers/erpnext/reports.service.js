const { erpNextClient } = require("./erpnext.service");
const { erpNextConfig } = require("../../config/erpnext.config");
class ErpReportsService {
  /**
   * Helper: Run an official Frappe Query Report in ERPNext.
   */
  static async runReport(reportName, filters = {}) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const defaultFilters = {
      company: erpNextConfig.company,
      from_date: `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`,
      to_date: today,
      fiscal_year: `${(/* @__PURE__ */ new Date()).getFullYear()}-${(/* @__PURE__ */ new Date()).getFullYear() + 1}`,
      periodicity: "Yearly",
      ...filters
    };
    const response = await erpNextClient.post(
      "/api/method/frappe.desk.query_report.run",
      {
        report_name: reportName,
        filters: defaultFilters
      }
    );
    return response.data.message;
  }
  /**
   * 1. Profit and Loss Statement from ERPNext.
   */
  static async getProfitAndLoss(options) {
    const fiscalYear = `${(/* @__PURE__ */ new Date()).getFullYear()}-${(/* @__PURE__ */ new Date()).getFullYear() + 1}`;
    return this.runReport("Profit and Loss Statement", {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      periodicity: options?.periodicity || "Yearly",
      year: String((/* @__PURE__ */ new Date()).getFullYear()),
      filter_based_on: "Fiscal Year",
      from_fiscal_year: fiscalYear,
      to_fiscal_year: fiscalYear
    });
  }
  /**
   * 2. Balance Sheet from ERPNext.
   */
  static async getBalanceSheet(options) {
    const fiscalYear = `${(/* @__PURE__ */ new Date()).getFullYear()}-${(/* @__PURE__ */ new Date()).getFullYear() + 1}`;
    return this.runReport("Balance Sheet", {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      periodicity: options?.periodicity || "Yearly",
      year: String((/* @__PURE__ */ new Date()).getFullYear()),
      filter_based_on: "Fiscal Year",
      from_fiscal_year: fiscalYear,
      to_fiscal_year: fiscalYear
    });
  }
  /**
   * 3. General Ledger from ERPNext.
   */
  static async getGeneralLedger(options) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const fromDate = options?.fromDate || `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`;
    const toDate = options?.toDate || today;
    return this.runReport("General Ledger", {
      from_date: fromDate,
      to_date: toDate,
      ...options?.account && { account: options.account },
      ...options?.party && { party: options.party }
    });
  }
  /**
   * 4. Trial Balance from ERPNext.
   */
  static async getTrialBalance(options) {
    return this.runReport("Trial Balance", {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      fiscal_year: `${(/* @__PURE__ */ new Date()).getFullYear()}-${(/* @__PURE__ */ new Date()).getFullYear() + 1}`
    });
  }
  /**
   * 5. Accounts Receivable (Customer Outstanding) from ERPNext.
   */
  static async getAccountsReceivable(options) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return this.runReport("Accounts Receivable", {
      report_date: options?.reportDate || today,
      ...options?.customer && { customer: options.customer }
    });
  }
  /**
   * 6. Accounts Payable (Supplier Outstanding) from ERPNext.
   */
  static async getAccountsPayable(options) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return this.runReport("Accounts Payable", {
      report_date: options?.reportDate || today,
      ...options?.supplier && { supplier: options.supplier }
    });
  }
  /**
   * 7. Stock Balance Report from ERPNext.
   */
  static async getStockBalanceReport(options) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    return this.runReport("Stock Balance", {
      from_date: `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`,
      to_date: today,
      ...options?.itemCode && { item_code: options.itemCode },
      ...options?.warehouse && { warehouse: options.warehouse }
    });
  }
  /**
   * Get net balance for an account directly from ERPNext GL Entries.
   */
  static async getAccountBalanceFromGL(accountName) {
    try {
      const response = await erpNextClient.get(
        "/api/resource/GL%20Entry",
        {
          params: {
            filters: JSON.stringify([["account", "=", accountName]]),
            fields: JSON.stringify(["debit", "credit"]),
            limit_page_length: 2e3
          }
        }
      );
      const entries = response.data.data || [];
      return entries.reduce((acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)), 0);
    } catch {
      return 0;
    }
  }
  /**
   * Dashboard Financial Summary (All figures from ERPNext).
   */
  static async getDashboardMetrics() {
    const [cashBal, bankBal, debtorsBal, creditorsBal, salesEntries, expenseEntries] = await Promise.all([
      this.getAccountBalanceFromGL("Cash - C"),
      this.getAccountBalanceFromGL("HDFC Bank - C"),
      this.getAccountBalanceFromGL("Debtors - C"),
      this.getAccountBalanceFromGL("Creditors - C"),
      erpNextClient.get("/api/resource/GL%20Entry", {
        params: {
          filters: JSON.stringify([["account", "=", "Sales - C"]]),
          fields: JSON.stringify(["debit", "credit"]),
          limit_page_length: 1e3
        }
      }).catch(() => ({ data: { data: [] } })),
      erpNextClient.get("/api/resource/GL%20Entry", {
        params: {
          filters: JSON.stringify([["account", "like", "%Expense%"]]),
          fields: JSON.stringify(["debit", "credit"]),
          limit_page_length: 1e3
        }
      }).catch(() => ({ data: { data: [] } }))
    ]);
    const salesList = salesEntries.data.data || [];
    const totalRevenue = salesList.reduce((acc, curr) => acc + (Number(curr.credit) - Number(curr.debit)), 0);
    const expenseList = expenseEntries.data.data || [];
    const totalExpenses = expenseList.reduce((acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)), 0);
    const netProfitLoss = totalRevenue - totalExpenses;
    return {
      cashBalance: Math.max(0, cashBal),
      bankBalance: bankBal,
      upiBalance: bankBal,
      // UPI routes to bank account
      customerOutstanding: Math.max(0, debtorsBal),
      supplierOutstanding: Math.max(0, -creditorsBal),
      totalRevenue,
      totalExpenses,
      netProfitLoss,
      source: "ERPNext Accounting Module",
      asOf: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
module.exports = {
  ErpReportsService,
};
