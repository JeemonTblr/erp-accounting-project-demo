const { Supplier } = require("../../models/supplier.model");
class SupplierSetter {
  static async createSupplier(data) {
    return Supplier.create({
      name: data.name.trim(),
      phone: data.phone ? data.phone.trim() : null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      address: data.address ? data.address.trim() : null,
      gstin: data.gstin ? data.gstin.trim() : null,
      supplierType: data.supplierType || "Wholesaler",
      erpnextSupplierId: data.erpnextSupplierId || null,
      isActive: data.isActive !== void 0 ? data.isActive : true
    });
  }
  static async updateSupplier(id, data) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== void 0) supplier.name = data.name.trim();
    if (data.phone !== void 0) supplier.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== void 0) supplier.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.address !== void 0) supplier.address = data.address ? data.address.trim() : null;
    if (data.gstin !== void 0) supplier.gstin = data.gstin ? data.gstin.trim() : null;
    if (data.supplierType !== void 0) supplier.supplierType = data.supplierType;
    if (data.erpnextSupplierId !== void 0) supplier.erpnextSupplierId = data.erpnextSupplierId;
    if (data.isActive !== void 0) supplier.isActive = data.isActive;
    await supplier.save();
    return supplier;
  }
  static async setErpnextId(id, erpnextSupplierId) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    supplier.erpnextSupplierId = erpnextSupplierId;
    await supplier.save();
    return supplier;
  }
  static async deleteSupplier(id) {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await supplier.destroy();
    return true;
  }
}
module.exports = {
  SupplierSetter,
};
