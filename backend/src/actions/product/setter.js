const { Product } = require("../../models/product.model");
const { ProductVariant } = require("../../models/product-variant.model");
const { sequelize } = require("../../config/database");
class ProductSetter {
  static async createProduct(data, variants) {
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.create(
        {
          name: data.name.trim(),
          sku: data.sku.trim().toUpperCase(),
          categoryId: data.categoryId,
          brand: data.brand ? data.brand.trim() : null,
          size: data.size ? data.size.trim() : null,
          colour: data.colour ? data.colour.trim() : null,
          fabricType: data.fabricType ? data.fabricType.trim() : null,
          purchasePrice: Number(data.purchasePrice),
          sellingPrice: Number(data.sellingPrice),
          gstRate: data.gstRate !== void 0 ? Number(data.gstRate) : 5,
          stockQuantity: data.stockQuantity !== void 0 ? Number(data.stockQuantity) : 0,
          reorderLevel: data.reorderLevel !== void 0 ? Number(data.reorderLevel) : 10,
          isActive: data.isActive !== void 0 ? data.isActive : true,
          erpnextItemCode: data.erpnextItemCode || null
        },
        { transaction }
      );
      if (variants && variants.length > 0) {
        for (const v of variants) {
          await ProductVariant.create(
            {
              productId: product.id,
              sku: v.sku.trim().toUpperCase(),
              size: v.size ? v.size.trim() : null,
              colour: v.colour ? v.colour.trim() : null,
              additionalPrice: v.additionalPrice ? Number(v.additionalPrice) : 0,
              stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0,
              isActive: true
            },
            { transaction }
          );
        }
      }
      await transaction.commit();
      return product;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async updateProduct(id, data) {
    const product = await Product.findByPk(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== void 0) product.name = data.name.trim();
    if (data.sku !== void 0) product.sku = data.sku.trim().toUpperCase();
    if (data.categoryId !== void 0) product.categoryId = data.categoryId;
    if (data.brand !== void 0) product.brand = data.brand;
    if (data.size !== void 0) product.size = data.size;
    if (data.colour !== void 0) product.colour = data.colour;
    if (data.fabricType !== void 0) product.fabricType = data.fabricType;
    if (data.purchasePrice !== void 0) product.purchasePrice = Number(data.purchasePrice);
    if (data.sellingPrice !== void 0) product.sellingPrice = Number(data.sellingPrice);
    if (data.gstRate !== void 0) product.gstRate = Number(data.gstRate);
    if (data.stockQuantity !== void 0) product.stockQuantity = Number(data.stockQuantity);
    if (data.reorderLevel !== void 0) product.reorderLevel = Number(data.reorderLevel);
    if (data.isActive !== void 0) product.isActive = data.isActive;
    if (data.erpnextItemCode !== void 0) product.erpnextItemCode = data.erpnextItemCode;
    await product.save();
    return product;
  }
  static async updateStock(id, delta, variantId) {
    const product = await Product.findByPk(id);
    if (!product) throw new Error(`Product ${id} not found`);
    product.stockQuantity = Number(product.stockQuantity) + Number(delta);
    await product.save();
    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (variant) {
        variant.stockQuantity = Number(variant.stockQuantity) + Number(delta);
        await variant.save();
      }
    }
  }
  static async deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await product.destroy();
    return true;
  }
  static async addVariant(productId, data) {
    return ProductVariant.create({
      productId,
      sku: data.sku.trim().toUpperCase(),
      size: data.size ? data.size.trim() : null,
      colour: data.colour ? data.colour.trim() : null,
      additionalPrice: data.additionalPrice ? Number(data.additionalPrice) : 0,
      stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0,
      isActive: true
    });
  }
  static async deleteVariant(variantId) {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);
    await variant.destroy();
    return true;
  }
}
module.exports = {
  ProductSetter,
};
