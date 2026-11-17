const { Supplier } = require("../../models/supplier.model");
class SupplierGetter {
  static async fetchById(id) {
    return Supplier.findByPk(id);
  }
  static async fetchAll(options) {
    const where = options?.activeOnly ? { isActive: true } : {};
    return Supplier.findAll({
      where,
      order: [["name", "ASC"]]
    });
  }
  static async fetchByErpId(erpnextSupplierId) {
    return Supplier.findOne({ where: { erpnextSupplierId } });
  }
  static async getAll(req, res, next) {
    try {
      const activeOnly = req.query.active === "true";
      const suppliers = await SupplierGetter.fetchAll({ activeOnly });
      res.status(200).json({
        success: true,
        count: suppliers.length,
        data: suppliers
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid supplier ID" });
        return;
      }
      const supplier = await SupplierGetter.fetchById(id);
      if (!supplier) {
        res.status(404).json({ success: false, message: `Supplier with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  SupplierGetter,
};
