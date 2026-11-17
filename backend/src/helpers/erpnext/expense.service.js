const { erpNextClient } = require("./erpnext.service");
const { erpNextConfig } = require("../../config/erpnext.config");
class ErpExpenseService {
  /**
   * Map local shop expense category to the appropriate ERPNext Expense Account.
   */
  static resolveExpenseAccount(category) {
    const cat = (category || "").toLowerCase().trim();
    if (cat.includes("rent")) {
      return "Office Rent - C";
    }
    if (cat.includes("electric") || cat.includes("water") || cat.includes("utility")) {
      return "Utility Expenses - C";
    }
    if (cat.includes("internet") || cat.includes("phone") || cat.includes("telephone") || cat.includes("wifi")) {
      return "Telephone Expenses - C";
    }
    if (cat.includes("transport") || cat.includes("travel") || cat.includes("fuel") || cat.includes("freight")) {
      return "Travel Expenses - C";
    }
    if (cat.includes("maintain") || cat.includes("repair") || cat.includes("cleaning")) {
      return "Office Maintenance Expenses - C";
    }
    if (cat.includes("market") || cat.includes("adver") || cat.includes("promo")) {
      return "Marketing Expenses - C";
    }
    if (cat.includes("print") || cat.includes("stationery") || cat.includes("paper")) {
      return "Print and Stationery - C";
    }
    if (cat.includes("salary") || cat.includes("wage")) {
      return "Salary - C";
    }
    return "Miscellaneous Expenses - C";
  }
  /**
   * Map payment method to the corresponding ERPNext Asset Account (Cash / Bank).
   */
  static resolveCreditAccount(paymentMethod) {
    const method = (paymentMethod || "CASH").toUpperCase();
    switch (method) {
      case "BANK":
      case "UPI":
      case "DEBIT_CARD":
      case "CREDIT_CARD":
        return "HDFC Bank - C";
      case "CASH":
      default:
        return "Cash - C";
    }
  }
  /**
   * Create a draft Journal Entry in ERPNext for a shop expense.
   */
  static async createJournalEntry(data) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const expenseAccount = this.resolveExpenseAccount(data.category);
    const creditAccount = this.resolveCreditAccount(data.paymentMethod);
    const amount = Number(data.amount);
    const remark = data.description ? `${data.title}: ${data.description}` : `${data.title} (${data.category}) - Ref: ${data.referenceNumber || "N/A"}`;
    const payload = {
      doctype: "Journal Entry",
      voucher_type: "Journal Entry",
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      user_remark: remark,
      accounts: [
        {
          account: expenseAccount,
          debit_in_account_currency: amount,
          credit_in_account_currency: 0
        },
        {
          account: creditAccount,
          debit_in_account_currency: 0,
          credit_in_account_currency: amount
        }
      ]
    };
    const response = await erpNextClient.post(
      "/api/resource/Journal%20Entry",
      payload
    );
    return response.data.data;
  }
  /**
   * Submit an existing draft Journal Entry in ERPNext.
   */
  static async submitJournalEntry(entryName) {
    const response = await erpNextClient.put(
      `/api/resource/Journal%20Entry/${encodeURIComponent(entryName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }
  /**
   * Helper: Create and immediately Submit a Journal Entry in ERPNext.
   * Returns the ERPNext document name (e.g. "ACC-JV-2026-00001").
   */
  static async createAndSubmitJournalEntry(data) {
    const draft = await this.createJournalEntry(data);
    const submitted = await this.submitJournalEntry(draft.name);
    return {
      journalEntryName: submitted.name,
      totalDebit: submitted.total_debit
    };
  }
  /**
   * Fetch Journal Entry details from ERPNext.
   */
  static async getJournalEntry(entryName) {
    try {
      const response = await erpNextClient.get(
        `/api/resource/Journal%20Entry/${encodeURIComponent(entryName)}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  }
}
module.exports = {
  ErpExpenseService,
};
