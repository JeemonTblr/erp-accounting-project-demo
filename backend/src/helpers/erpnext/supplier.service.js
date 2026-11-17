const { erpNextClient } = require("./erpnext.service");
class ErpSupplierService {
  /**
   * Create a Supplier in ERPNext.
   * Returns the ERPNext document name (used as erpnextSupplierId in MariaDB).
   */
  static async createSupplier(data) {
    const payload = {
      supplier_name: data.name,
      supplier_type: data.supplierType === "Individual" ? "Individual" : "Company",
      supplier_group: "All Supplier Groups",
      ...data.phone && { mobile_no: data.phone },
      ...data.email && { email_id: data.email },
      ...data.gstin && { tax_id: data.gstin }
    };
    const response = await erpNextClient.post(
      "/api/resource/Supplier",
      payload
    );
    return response.data.data.name;
  }
  /**
   * Update an existing Supplier in ERPNext.
   */
  static async updateSupplier(erpnextName, data) {
    const payload = {
      ...data.name && { supplier_name: data.name },
      ...data.supplierType && {
        supplier_type: data.supplierType === "Individual" ? "Individual" : "Company"
      },
      ...data.phone !== void 0 && { mobile_no: data.phone ?? "" },
      ...data.email !== void 0 && { email_id: data.email ?? "" },
      ...data.gstin !== void 0 && { tax_id: data.gstin ?? "" }
    };
    await erpNextClient.put(
      `/api/resource/Supplier/${encodeURIComponent(erpnextName)}`,
      payload
    );
  }
  /**
   * Check if a Supplier already exists in ERPNext by name.
   */
  static async findByName(name) {
    try {
      const response = await erpNextClient.get(
        `/api/resource/Supplier/${encodeURIComponent(name)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }
  /**
   * Sync supplier to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext supplier name.
   */
  static async sync(data) {
    if (data.existingErpnextId) {
      await this.updateSupplier(data.existingErpnextId, data);
      return data.existingErpnextId;
    }
    const existing = await this.findByName(data.name);
    if (existing) return existing;
    return this.createSupplier(data);
  }
}
module.exports = {
  ErpSupplierService,
};
