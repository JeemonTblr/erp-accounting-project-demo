import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { sequelize } from '../../config/database';

export interface CreateStockAdjustmentInput {
  productId: number;
  variantId?: number | null;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  notes?: string | null;
  referenceType?: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'INITIAL_STOCK';
  referenceId?: number | null;
  erpnextStockEntryId?: string | null;
}

export class InventorySetter {
  public static async recordAdjustment(input: CreateStockAdjustmentInput): Promise<InventoryTransaction> {
    const transaction = await sequelize.transaction();

    try {
      const product = await Product.findByPk(input.productId, { transaction });
      if (!product) throw new Error(`Product with ID ${input.productId} not found.`);

      const qty = Number(input.quantity);
      // Determine delta depending on transaction type
      let delta = qty;
      if (input.transactionType === 'STOCK_OUT' || input.transactionType === 'DAMAGE') {
        delta = -Math.abs(qty);
      } else if (input.transactionType === 'STOCK_IN' || input.transactionType === 'RETURN') {
        delta = Math.abs(qty);
      } // for ADJUSTMENT, qty can be positive or negative

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
          referenceType: input.referenceType || 'ADJUSTMENT',
          referenceId: input.referenceId || null,
          notes: input.notes || null,
          erpnextStockEntryId: input.erpnextStockEntryId || null,
          transactionDate: new Date(),
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

  public static async deleteTransaction(id: number): Promise<boolean> {
    const invTx = await InventoryTransaction.findByPk(id);
    if (!invTx) throw new Error(`Inventory transaction with ID ${id} not found.`);

    await invTx.destroy();
    return true;
  }
}

