const { erpNextClient } = require("./erpnext.service");
const { erpNextConfig } = require("../../config/erpnext.config");
class ErpStockService {
  static DEFAULT_WAREHOUSE = "Stores - C";
  static DEFAULT_EXPENSE_ACCOUNT = "Stock Adjustment - C";
  /**
   * Create a draft Stock Entry in ERPNext.
   */
  static async createStockEntry(data) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const warehouse = data.warehouse || this.DEFAULT_WAREHOUSE;
    const payload = {
      doctype: "Stock Entry",
      stock_entry_type: data.entryType,
      purpose: data.entryType,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      ...data.remarks && { remarks: data.remarks },
      items: data.items.map((item) => ({
        item_code: item.itemCode,
        qty: Number(item.qty),
        ...data.entryType === "Material Issue" ? { s_warehouse: warehouse, expense_account: this.DEFAULT_EXPENSE_ACCOUNT } : { t_warehouse: warehouse, expense_account: this.DEFAULT_EXPENSE_ACCOUNT },
        ...item.rate !== void 0 && { basic_rate: Number(item.rate) }
      }))
    };
    const response = await erpNextClient.post(
      "/api/resource/Stock%20Entry",
      payload
    );
    return response.data.data;
  }
  /**
   * Submit an existing draft Stock Entry in ERPNext.
   */
  static async submitStockEntry(entryName) {
    const response = await erpNextClient.put(
      `/api/resource/Stock%20Entry/${encodeURIComponent(entryName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }
  /**
   * Helper: Create and immediately Submit a Stock Entry.
   * Returns ERPNext document name.
   */
  static async createAndSubmitStockEntry(data) {
    const draft = await this.createStockEntry(data);
    const submitted = await this.submitStockEntry(draft.name);
    return {
      stockEntryName: submitted.name,
      totalAmount: submitted.total_amount
    };
  }
  /**
   * Query official stock balance for an item in ERPNext warehouse.
   */
  static async getStockBalance(itemCode, warehouse) {
    const wh = warehouse || this.DEFAULT_WAREHOUSE;
    try {
      const response = await erpNextClient.get(
        "/api/method/erpnext.stock.utils.get_stock_balance",
        {
          params: {
            item_code: itemCode,
            warehouse: wh
          }
        }
      );
      return Number(response.data.data?.actual_qty ?? response.data.data ?? 0);
    } catch {
      return 0;
    }
  }
}
module.exports = {
  ErpStockService,
};
