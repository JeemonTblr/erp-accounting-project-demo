const { InventoryTransaction } = require("../../models/inventory-transaction.model");
const { Product } = require("../../models/product.model");
const { ProductVariant } = require("../../models/product-variant.model");
const { sequelize } = require("../../config/database");
class InventorySetter {
  static async recordAdjustment(input) {
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.findByPk(input.productId, { transaction });
      if (!product) throw new Error(`Product with ID ${input.productId} not found.`);
      const qty = Number(input.quantity);
      let delta = qty;
      if (input.transactionType === "STOCK_OUT" || input.transactionType === "DAMAGE") {
        delta = -Math.abs(qty);
      } else if (input.transactionType === "STOCK_IN" || input.transactionType === "RETURN") {
        delta = Math.abs(qty);
      }
      product.stockQuantity = Number(product.stockQuantity) + delta;
      await product.save({ transaction });
      if (input.variantId) {
        const variant = await ProductVariant.findByPk(input.variantId, { transaction });
        if (variant) {
          variant.stockQuantity = Number(variant.stockQuantity) + delta;
          await variant.save({ transaction });
        }
      }
      const invTx = await InventoryTransaction.create(
        {
          productId: input.productId,
          variantId: input.variantId || null,
          transactionType: input.transactionType,
          quantity: qty,
          referenceType: input.referenceType || "ADJUSTMENT",
          referenceId: input.referenceId || null,
          notes: input.notes || null,
          erpnextStockEntryId: input.erpnextStockEntryId || null,
          transactionDate: /* @__PURE__ */ new Date()
        },
        { transaction }
      );
      await transaction.commit();
      return invTx;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async deleteTransaction(id) {
    const invTx = await InventoryTransaction.findByPk(id);
    if (!invTx) throw new Error(`Inventory transaction with ID ${id} not found.`);
    await invTx.destroy();
    return true;
  }
}
module.exports = {
  InventorySetter,
};
