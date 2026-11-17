const { Op } = require("sequelize");
const { Sale } = require("../../models/sale.model");
const { SaleItem } = require("../../models/sale-item.model");
const { Customer } = require("../../models/customer.model");
const { Product } = require("../../models/product.model");
class SaleGetter {
  static async fetchById(id) {
    return Sale.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        {
          model: SaleItem,
          as: "items",
          include: [{ model: Product, as: "product", attributes: ["id", "name", "sku"] }]
        }
      ]
    });
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.customerId) {
      where.customerId = options.customerId;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }
    if (options?.startDate || options?.endDate) {
      const dateFilter = {};
      if (options.startDate) dateFilter[Op.gte] = options.startDate;
      if (options.endDate) dateFilter[Op.lte] = options.endDate;
      where.saleDate = dateFilter;
    }
    return Sale.findAll({
      where,
      include: [
        { model: Customer, as: "customer", attributes: ["id", "name", "phone"] },
        { model: SaleItem, as: "items" }
      ],
      order: [["saleDate", "DESC"]]
    });
  }
  static async fetchTodaySales() {
    const startOfDay = /* @__PURE__ */ new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = /* @__PURE__ */ new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const sales = await Sale.findAll({
      where: {
        saleDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      },
      include: [{ model: Customer, as: "customer", attributes: ["id", "name"] }],
      order: [["saleDate", "DESC"]]
    });
    const totalAmount = sales.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
    return {
      totalSales: sales.length,
      totalAmount,
      sales
    };
  }
  static async getAll(req, res, next) {
    try {
      const customerId = req.query.customer_id ? parseInt(req.query.customer_id, 10) : void 0;
      const paymentStatus = req.query.status;
      const sales = await SaleGetter.fetchAll({ customerId, paymentStatus });
      res.status(200).json({
        success: true,
        count: sales.length,
        data: sales
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid sale ID" });
        return;
      }
      const sale = await SaleGetter.fetchById(id);
      if (!sale) {
        res.status(404).json({ success: false, message: `Sale with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: sale
      });
    } catch (error) {
      next(error);
    }
  }
  static async getTodaySummary(_req, res, next) {
    try {
      const summary = await SaleGetter.fetchTodaySales();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  SaleGetter,
};
