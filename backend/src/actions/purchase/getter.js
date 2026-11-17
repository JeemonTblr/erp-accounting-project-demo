const { Op } = require("sequelize");
const { Purchase } = require("../../models/purchase.model");
const { PurchaseItem } = require("../../models/purchase-item.model");
const { Supplier } = require("../../models/supplier.model");
const { Product } = require("../../models/product.model");
class PurchaseGetter {
  static async fetchById(id) {
    return Purchase.findByPk(id, {
      include: [
        { model: Supplier, as: "supplier" },
        {
          model: PurchaseItem,
          as: "items",
          include: [{ model: Product, as: "product", attributes: ["id", "name", "sku"] }]
        }
      ]
    });
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.supplierId) {
      where.supplierId = options.supplierId;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }
    return Purchase.findAll({
      where,
      include: [
        { model: Supplier, as: "supplier", attributes: ["id", "name", "phone"] },
        { model: PurchaseItem, as: "items" }
      ],
      order: [["purchaseDate", "DESC"]]
    });
  }
  static async fetchTodayPurchases() {
    const startOfDay = /* @__PURE__ */ new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = /* @__PURE__ */ new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const purchases = await Purchase.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });
    const totalAmount = purchases.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
    return {
      totalPurchases: purchases.length,
      totalAmount
    };
  }
  static async getAll(req, res, next) {
    try {
      const supplierId = req.query.supplier_id ? parseInt(req.query.supplier_id, 10) : void 0;
      const paymentStatus = req.query.status;
      const purchases = await PurchaseGetter.fetchAll({ supplierId, paymentStatus });
      res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid purchase ID" });
        return;
      }
      const purchase = await PurchaseGetter.fetchById(id);
      if (!purchase) {
        res.status(404).json({ success: false, message: `Purchase with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: purchase
      });
    } catch (error) {
      next(error);
    }
  }
  static async getTodaySummary(_req, res, next) {
    try {
      const summary = await PurchaseGetter.fetchTodayPurchases();
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
  PurchaseGetter,
};
