import { Request, Response, NextFunction } from 'express';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';

export class InventoryGetter {
  public static async fetchById(id: number): Promise<InventoryTransaction | null> {
    return InventoryTransaction.findByPk(id, {
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'size', 'colour'] },
      ],
    });
  }

  public static async fetchAll(options?: {
    productId?: number;
    transactionType?: string;
  }): Promise<InventoryTransaction[]> {
    const where: Record<string, unknown> = {};

    if (options?.productId) where.productId = options.productId;
    if (options?.transactionType) where.transactionType = options.transactionType;

    return InventoryTransaction.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sku'] },
        { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'size', 'colour'] },
      ],
      order: [['transactionDate', 'DESC']],
    });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = req.query.product_id ? parseInt(req.query.product_id as string, 10) : undefined;
      const transactionType = req.query.type as string | undefined;

      const transactions = await InventoryGetter.fetchAll({ productId, transactionType });
      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid transaction ID' });
        return;
      }

      const tx = await InventoryGetter.fetchById(id);
      if (!tx) {
        res.status(404).json({ success: false, message: `Transaction with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: tx,
      });
    } catch (error) {
      next(error);
    }
  }
}

