const { Purchase } = require("../../models/purchase.model");
const { PurchaseItem } = require("../../models/purchase-item.model");
const { Product } = require("../../models/product.model");
const { ProductVariant } = require("../../models/product-variant.model");
const { InventoryTransaction } = require("../../models/inventory-transaction.model");
const { sequelize } = require("../../config/database");
class PurchaseSetter {
  static generatePurchaseNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `PUR-${(/* @__PURE__ */ new Date()).getFullYear()}-${timestamp}${random}`;
  }
  static async createPurchase(input) {
    const transaction = await sequelize.transaction();
    try {
      const purchaseNumber = this.generatePurchaseNumber();
      let subtotal = 0;
      let totalTax = 0;
      const preparedItems = [];
      for (const item of input.items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }
        let sku = product.sku;
        let itemName = product.name;
        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction });
          if (!variant) {
            throw new Error(`Variant ${item.variantId} not found.`);
          }
          sku = variant.sku;
          itemName = `${product.name} (${variant.size || ""} ${variant.colour || ""})`.trim();
        }
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice || product.purchasePrice);
        const taxable = quantity * unitPrice;
        const taxRate = Number(item.taxRate !== void 0 ? item.taxRate : product.gstRate);
        const taxAmount = taxable * taxRate / 100;
        const totalAmount = taxable + taxAmount;
        subtotal += taxable;
        totalTax += taxAmount;
        preparedItems.push({
          productId: item.productId,
          variantId: item.variantId || null,
          itemName,
          sku,
          quantity,
          unitPrice,
          taxRate,
          taxAmount,
          totalAmount
        });
        product.stockQuantity = Number(product.stockQuantity) + quantity;
        await product.save({ transaction });
        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction });
          if (variant) {
            variant.stockQuantity = Number(variant.stockQuantity) + quantity;
            await variant.save({ transaction });
          }
        }
      }
      const grandTotal = subtotal + totalTax;
      const paidAmount = input.paidAmount !== void 0 ? Number(input.paidAmount) : input.paymentStatus === "PAID" ? grandTotal : 0;
      const purchase = await Purchase.create(
        {
          purchaseNumber,
          supplierId: input.supplierId,
          purchaseDate: /* @__PURE__ */ new Date(),
          subtotal,
          taxAmount: totalTax,
          grandTotal,
          paymentStatus: input.paymentStatus || (paidAmount >= grandTotal ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID"),
          paidAmount,
          notes: input.notes || null
        },
        { transaction }
      );
      for (const pi of preparedItems) {
        await PurchaseItem.create(
          {
            purchaseId: purchase.id,
            productId: pi.productId,
            variantId: pi.variantId,
            itemName: pi.itemName,
            sku: pi.sku,
            quantity: pi.quantity,
            unitPrice: pi.unitPrice,
            taxRate: pi.taxRate,
            taxAmount: pi.taxAmount,
            totalAmount: pi.totalAmount
          },
          { transaction }
        );
        await InventoryTransaction.create(
          {
            productId: pi.productId,
            variantId: pi.variantId,
            transactionType: "STOCK_IN",
            quantity: pi.quantity,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            notes: `Stock purchase ${purchaseNumber}`,
            transactionDate: /* @__PURE__ */ new Date()
          },
          { transaction }
        );
      }
      await transaction.commit();
      return purchase;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  static async setErpnextReferences(id, erpnextPurchaseInvoiceId, erpnextReceiptId) {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) throw new Error(`Purchase with ID ${id} not found.`);
    purchase.erpnextPurchaseInvoiceId = erpnextPurchaseInvoiceId;
    if (erpnextReceiptId !== void 0) {
      purchase.erpnextReceiptId = erpnextReceiptId;
    }
    await purchase.save();
    return purchase;
  }
  static async deletePurchase(id) {
    const purchase = await Purchase.findByPk(id);
    if (!purchase) throw new Error(`Purchase with ID ${id} not found.`);
    await purchase.destroy();
    return true;
  }
}
module.exports = {
  PurchaseSetter,
};
