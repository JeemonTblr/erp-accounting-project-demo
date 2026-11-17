const { Customer } = require("../../models/customer.model");
class CustomerGetter {
  static async fetchById(id) {
    return Customer.findByPk(id);
  }
  static async fetchAll(options) {
    const where = options?.activeOnly ? { isActive: true } : {};
    return Customer.findAll({
      where,
      order: [["name", "ASC"]]
    });
  }
  static async fetchByErpId(erpnextCustomerId) {
    return Customer.findOne({ where: { erpnextCustomerId } });
  }
  static async getAll(req, res, next) {
    try {
      const activeOnly = req.query.active === "true";
      const customers = await CustomerGetter.fetchAll({ activeOnly });
      res.status(200).json({
        success: true,
        count: customers.length,
        data: customers
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid customer ID" });
        return;
      }
      const customer = await CustomerGetter.fetchById(id);
      if (!customer) {
        res.status(404).json({ success: false, message: `Customer with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  CustomerGetter,
};
