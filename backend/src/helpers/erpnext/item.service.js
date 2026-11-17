const { erpNextClient } = require("./erpnext.service");
class ErpItemService {
  /**
   * Ensure a Brand exists in ERPNext before assigning to an item.
   */
  static async ensureBrand(brandName) {
    try {
      await erpNextClient.get(`/api/resource/Brand/${encodeURIComponent(brandName)}`);
    } catch {
      try {
        await erpNextClient.post("/api/resource/Brand", { brand: brandName });
      } catch (e) {
        console.warn(`Could not auto-create brand ${brandName} in ERPNext:`, e);
      }
    }
  }
  /**
   * Determine the ERPNext item group based on local category.
   * Standard valid non-group item groups: "Products", "Raw Material", "Consumable"
   */
  static resolveItemGroup(categoryName) {
    if (!categoryName) return "Products";
    if (categoryName.toLowerCase().includes("fabric") || categoryName.toLowerCase().includes("raw")) {
      return "Raw Material";
    }
    return "Products";
  }
  /**
   * Create an Item in ERPNext.
   * Returns the ERPNext item_code (used as erpnextItemCode in MariaDB).
   */
  static async createItem(data) {
    if (data.brand && data.brand.trim()) {
      await this.ensureBrand(data.brand.trim());
    }
    const payload = {
      item_code: data.sku,
      item_name: data.name,
      item_group: this.resolveItemGroup(data.categoryName),
      stock_uom: "Nos",
      is_stock_item: 1,
      standard_rate: data.sellingPrice,
      valuation_rate: data.purchasePrice,
      opening_stock: data.stockQuantity ?? 0,
      ...data.brand && { brand: data.brand.trim() }
    };
    const response = await erpNextClient.post(
      "/api/resource/Item",
      payload
    );
    return response.data.data.name;
  }
  /**
   * Update an existing Item in ERPNext.
   */
  static async updateItem(erpnextCode, data) {
    if (data.brand && data.brand.trim()) {
      await this.ensureBrand(data.brand.trim());
    }
    const payload = {
      ...data.name && { item_name: data.name },
      ...data.sellingPrice !== void 0 && { standard_rate: data.sellingPrice },
      ...data.purchasePrice !== void 0 && { valuation_rate: data.purchasePrice },
      ...data.brand !== void 0 && { brand: data.brand ? data.brand.trim() : "" },
      ...data.categoryName && {
        item_group: this.resolveItemGroup(data.categoryName)
      }
    };
    await erpNextClient.put(
      `/api/resource/Item/${encodeURIComponent(erpnextCode)}`,
      payload
    );
  }
  /**
   * Check if an Item already exists in ERPNext by item_code (SKU).
   */
  static async findBySku(sku) {
    try {
      const response = await erpNextClient.get(
        `/api/resource/Item/${encodeURIComponent(sku)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }
  /**
   * Sync item to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext item code.
   */
  static async sync(data) {
    if (data.existingErpnextCode) {
      await this.updateItem(data.existingErpnextCode, data);
      return data.existingErpnextCode;
    }
    const existing = await this.findBySku(data.sku);
    if (existing) return existing;
    return this.createItem(data);
  }
}
module.exports = {
  ErpItemService,
};
