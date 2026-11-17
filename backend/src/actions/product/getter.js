const { Op } = require("sequelize");
const { Product } = require("../../models/product.model");
const { ProductVariant } = require("../../models/product-variant.model");
const { Category } = require("../../models/category.model");
const { sequelize } = require("../../config/database");
class ProductGetter {
  static async fetchById(id) {
    return Product.findByPk(id, {
      include: [
        { model: Category, as: "category" },
        { model: ProductVariant, as: "variants" }
      ]
    });
  }
  static async fetchBySku(sku) {
    return Product.findOne({
      where: { sku: sku.trim().toUpperCase() },
      include: [{ model: ProductVariant, as: "variants" }]
    });
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.activeOnly) {
      where.isActive = true;
    }
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${options.search}%` } },
        { sku: { [Op.like]: `%${options.search}%` } },
        { brand: { [Op.like]: `%${options.search}%` } }
      ];
    }
    return Product.findAll({
      where,
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: ProductVariant, as: "variants" }
      ],
      order: [["name", "ASC"]]
    });
  }
  static async fetchLowStock() {
    return Product.findAll({
      where: sequelize.where(
        sequelize.col("stock_quantity"),
        "<=",
        sequelize.col("reorder_level")
      ),
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["stockQuantity", "ASC"]]
    });
  }
  static async getAll(req, res, next) {
    try {
      const categoryId = req.query.category_id ? parseInt(req.query.category_id, 10) : void 0;
      const search = req.query.search ? req.query.search : void 0;
      const activeOnly = req.query.active === "true";
      const products = await ProductGetter.fetchAll({ categoryId, search, activeOnly });
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid product ID" });
        return;
      }
      const product = await ProductGetter.fetchById(id);
      if (!product) {
        res.status(404).json({ success: false, message: `Product with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }
  static async getLowStock(_req, res, next) {
    try {
      const lowStockProducts = await ProductGetter.fetchLowStock();
      res.status(200).json({
        success: true,
        count: lowStockProducts.length,
        data: lowStockProducts
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ProductGetter,
};
