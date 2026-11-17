const { InventoryTransaction } = require("../../models/inventory-transaction.model");
const { Product } = require("../../models/product.model");
const { ProductVariant } = require("../../models/product-variant.model");
class InventoryGetter {
  static async fetchById(id) {
    return InventoryTransaction.findByPk(id, {
      include: [
        { model: Product, as: "product", attributes: ["id", "name", "sku"] },
        { model: ProductVariant, as: "variant", attributes: ["id", "sku", "size", "colour"] }
      ]
    });
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.productId) where.productId = options.productId;
    if (options?.transactionType) where.transactionType = options.transactionType;
    return InventoryTransaction.findAll({
      where,
      include: [
        { model: Product, as: "product", attributes: ["id", "name", "sku"] },
        { model: ProductVariant, as: "variant", attributes: ["id", "sku", "size", "colour"] }
      ],
      order: [["transactionDate", "DESC"]]
    });
  }
  static async getAll(req, res, next) {
    try {
      const productId = req.query.product_id ? parseInt(req.query.product_id, 10) : void 0;
      const transactionType = req.query.type;
      const transactions = await InventoryGetter.fetchAll({ productId, transactionType });
      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid transaction ID" });
        return;
      }
      const tx = await InventoryGetter.fetchById(id);
      if (!tx) {
        res.status(404).json({ success: false, message: `Transaction with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: tx
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  InventoryGetter,
};
