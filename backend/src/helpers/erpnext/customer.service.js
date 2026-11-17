const { erpNextClient } = require("./erpnext.service");
class ErpCustomerService {
  /**
   * Create a Customer in ERPNext.
   * Returns the ERPNext document name (used as erpnextCustomerId in MariaDB).
   */
  static async createCustomer(data) {
    const isCompany = data.customerType === "Company" || data.customerType === "Wholesaler" || data.customerType === "Corporate";
    const payload = {
      customer_name: data.name,
      customer_type: isCompany ? "Company" : "Individual",
      customer_group: isCompany ? "Commercial" : "Individual",
      territory: "All Territories",
      ...data.phone && { mobile_no: data.phone },
      ...data.email && { email_id: data.email },
      ...data.gstin && { tax_id: data.gstin }
    };
    const response = await erpNextClient.post(
      "/api/resource/Customer",
      payload
    );
    return response.data.data.name;
  }
  /**
   * Update an existing Customer in ERPNext.
   */
  static async updateCustomer(erpnextName, data) {
    const isCompany = data.customerType === "Company" || data.customerType === "Wholesaler" || data.customerType === "Corporate";
    const payload = {
      ...data.name && { customer_name: data.name },
      ...data.customerType && {
        customer_type: isCompany ? "Company" : "Individual",
        customer_group: isCompany ? "Commercial" : "Individual"
      },
      ...data.phone !== void 0 && { mobile_no: data.phone ?? "" },
      ...data.email !== void 0 && { email_id: data.email ?? "" },
      ...data.gstin !== void 0 && { tax_id: data.gstin ?? "" }
    };
    await erpNextClient.put(
      `/api/resource/Customer/${encodeURIComponent(erpnextName)}`,
      payload
    );
  }
  /**
   * Check if a Customer already exists in ERPNext by name.
   */
  static async findByName(name) {
    try {
      const response = await erpNextClient.get(
        `/api/resource/Customer/${encodeURIComponent(name)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }
  /**
   * Get outstanding receivable amount for a customer from ERPNext.
   */
  static async getOutstanding(erpnextName) {
    const response = await erpNextClient.get(
      "/api/method/frappe.client.get_value",
      {
        params: {
          doctype: "Customer",
          filters: JSON.stringify({ name: erpnextName }),
          fieldname: JSON.stringify(["outstanding_amount"])
        }
      }
    );
    return response.data.data?.outstanding_amount ?? 0;
  }
  /**
   * Sync customer to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext customer name.
   */
  static async sync(data) {
    if (data.existingErpnextId) {
      await this.updateCustomer(data.existingErpnextId, data);
      return data.existingErpnextId;
    }
    const existing = await this.findByName(data.name);
    if (existing) return existing;
    return this.createCustomer(data);
  }
}
module.exports = {
  ErpCustomerService,
};
