import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Purchase } from '../../models/purchase.model';
import { PurchaseItem } from '../../models/purchase-item.model';
import { Supplier } from '../../models/supplier.model';
import { Product } from '../../models/product.model';

export class PurchaseGetter {
  public static async fetchById(id: number): Promise<Purchase | null> {
    return Purchase.findByPk(id, {
      include: [
        { model: Supplier, as: 'supplier' },
        {
          model: PurchaseItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
        },
      ],
    });
  }

  public static async fetchAll(options?: {
    supplierId?: number;
    paymentStatus?: string;
  }): Promise<Purchase[]> {
    const where: Record<string, unknown> = {};

    if (options?.supplierId) {
      where.supplierId = options.supplierId;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    return Purchase.findAll({
      where,
      include: [
        { model: Supplier, as: 'supplier', attributes: ['id', 'name', 'phone'] },
        { model: PurchaseItem, as: 'items' },
      ],
      order: [['purchaseDate', 'DESC']],
    });
  }

  public static async fetchTodayPurchases(): Promise<{ totalPurchases: number; totalAmount: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const purchases = await Purchase.findAll({
      where: {
        purchaseDate: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    const totalAmount = purchases.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
    return {
      totalPurchases: purchases.length,
      totalAmount,
    };
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplierId = req.query.supplier_id ? parseInt(req.query.supplier_id as string, 10) : undefined;
      const paymentStatus = req.query.status as string | undefined;

      const purchases = await PurchaseGetter.fetchAll({ supplierId, paymentStatus });
      res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid purchase ID' });
        return;
      }

      const purchase = await PurchaseGetter.fetchById(id);
      if (!purchase) {
        res.status(404).json({ success: false, message: `Purchase with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: purchase,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTodaySummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await PurchaseGetter.fetchTodayPurchases();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

