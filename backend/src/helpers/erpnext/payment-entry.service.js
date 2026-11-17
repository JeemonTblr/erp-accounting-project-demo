const { erpNextClient } = require("./erpnext.service");
const { erpNextConfig } = require("../../config/erpnext.config");
class ErpPaymentEntryService {
  /**
   * Determine the appropriate ERPNext Mode of Payment and Account
   * based on the local payment method.
   */
  static resolvePaymentAccount(paymentMethod) {
    const method = (paymentMethod || "CASH").toUpperCase();
    switch (method) {
      case "BANK":
      case "WIRE_TRANSFER":
        return { modeOfPayment: "Wire Transfer", account: "HDFC Bank - C" };
      case "UPI":
        return { modeOfPayment: "Wire Transfer", account: "HDFC Bank - C" };
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return { modeOfPayment: "Credit Card", account: "HDFC Bank - C" };
      case "CASH":
      default:
        return { modeOfPayment: "Cash", account: "Cash - C" };
    }
  }
  /**
   * Create a draft Payment Entry in ERPNext for a customer receipt.
   */
  static async createCustomerPayment(data) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { modeOfPayment, account } = this.resolvePaymentAccount(data.paymentMethod);
    const payload = {
      doctype: "Payment Entry",
      payment_type: "Receive",
      party_type: "Customer",
      party: data.customerName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      mode_of_payment: modeOfPayment,
      paid_to: account,
      paid_amount: Number(data.amount),
      received_amount: Number(data.amount),
      reference_no: data.referenceNumber || `PAY-${Date.now()}`,
      reference_date: data.postingDate || today,
      ...data.remarks && { remarks: data.remarks },
      ...data.invoiceName && {
        references: [
          {
            reference_doctype: "Sales Invoice",
            reference_name: data.invoiceName,
            total_amount: Number(data.amount),
            outstanding_amount: Number(data.amount),
            allocated_amount: Number(data.amount)
          }
        ]
      }
    };
    const response = await erpNextClient.post(
      "/api/resource/Payment%20Entry",
      payload
    );
    return response.data.data;
  }
  /**
   * Create a draft Payment Entry in ERPNext for paying a supplier.
   */
  static async createSupplierPayment(data) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { modeOfPayment, account } = this.resolvePaymentAccount(data.paymentMethod || "WIRE_TRANSFER");
    const payload = {
      doctype: "Payment Entry",
      payment_type: "Pay",
      party_type: "Supplier",
      party: data.supplierName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      mode_of_payment: modeOfPayment,
      paid_from: account,
      paid_amount: Number(data.amount),
      received_amount: Number(data.amount),
      reference_no: data.referenceNumber || `PUR-PAY-${Date.now()}`,
      reference_date: data.postingDate || today,
      ...data.remarks && { remarks: data.remarks },
      ...data.invoiceName && {
        references: [
          {
            reference_doctype: "Purchase Invoice",
            reference_name: data.invoiceName,
            total_amount: Number(data.amount),
            outstanding_amount: Number(data.amount),
            allocated_amount: Number(data.amount)
          }
        ]
      }
    };
    const response = await erpNextClient.post(
      "/api/resource/Payment%20Entry",
      payload
    );
    return response.data.data;
  }
  /**
   * Submit an existing draft Payment Entry in ERPNext.
   */
  static async submitPayment(paymentName) {
    const response = await erpNextClient.put(
      `/api/resource/Payment%20Entry/${encodeURIComponent(paymentName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }
  /**
   * Helper: Create and immediately Submit a Customer Payment Entry.
   */
  static async createAndSubmitCustomerPayment(data) {
    const draft = await this.createCustomerPayment(data);
    const submitted = await this.submitPayment(draft.name);
    return {
      paymentName: submitted.name,
      paidAmount: submitted.paid_amount
    };
  }
  /**
   * Helper: Create and immediately Submit a Supplier Payment Entry.
   */
  static async createAndSubmitSupplierPayment(data) {
    const draft = await this.createSupplierPayment(data);
    const submitted = await this.submitPayment(draft.name);
    return {
      paymentName: submitted.name,
      paidAmount: submitted.paid_amount
    };
  }
}
module.exports = {
  ErpPaymentEntryService,
};
