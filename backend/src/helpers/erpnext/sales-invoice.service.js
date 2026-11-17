const { erpNextClient } = require("./erpnext.service");
const { erpNextConfig } = require("../../config/erpnext.config");
class ErpSalesInvoiceService {
  /**
   * Create a draft Sales Invoice in ERPNext.
   */
  static async createInvoice(data) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const payload = {
      customer: data.customerName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      due_date: data.dueDate || today,
      items: data.items.map((item) => ({
        item_code: item.itemCode,
        qty: Number(item.qty),
        rate: Number(item.rate),
        ...item.description && { description: item.description }
      })),
      ...data.remarks && { remarks: data.remarks },
      update_stock: data.updateStock ? 1 : 0
    };
    const response = await erpNextClient.post(
      "/api/resource/Sales%20Invoice",
      payload
    );
    return response.data.data;
  }
  /**
   * Submit an existing draft Sales Invoice in ERPNext.
   */
  static async submitInvoice(invoiceName) {
    const response = await erpNextClient.put(
      `/api/resource/Sales%20Invoice/${encodeURIComponent(invoiceName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }
  /**
   * Helper: Create and immediately Submit a Sales Invoice in ERPNext.
   * Returns the ERPNext document name (e.g. "ACC-SINV-2026-00001").
   */
  static async createAndSubmitInvoice(data) {
    const draft = await this.createInvoice(data);
    const submitted = await this.submitInvoice(draft.name);
    return {
      invoiceName: submitted.name,
      grandTotal: submitted.grand_total
    };
  }
  /**
   * Fetch invoice details from ERPNext.
   */
  static async getInvoice(invoiceName) {
    try {
      const response = await erpNextClient.get(
        `/api/resource/Sales%20Invoice/${encodeURIComponent(invoiceName)}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  }
}
module.exports = {
  ErpSalesInvoiceService,
};
