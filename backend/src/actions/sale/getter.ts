import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Sale } from '../../models/sale.model';
import { SaleItem } from '../../models/sale-item.model';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';

export class SaleGetter {
  public static async fetchById(id: number): Promise<Sale | null> {
    return Sale.findByPk(id, {
      include: [
        { model: Customer, as: 'customer' },
        {
          model: SaleItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
        },
      ],
    });
  }

  public static async fetchAll(options?: {
    customerId?: number;
    startDate?: Date;
    endDate?: Date;
    paymentStatus?: string;
  }): Promise<Sale[]> {
    const where: Record<string, unknown> = {};

    if (options?.customerId) {
      where.customerId = options.customerId;
    }
    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }
    if (options?.startDate || options?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (options.startDate) dateFilter[Op.gte as unknown as string] = options.startDate;
      if (options.endDate) dateFilter[Op.lte as unknown as string] = options.endDate;
      where.saleDate = dateFilter;
    }

    return Sale.findAll({
      where,
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone'] },
        { model: SaleItem, as: 'items' },
      ],
      order: [['saleDate', 'DESC']],
    });
  }

  public static async fetchTodaySales(): Promise<{ totalSales: number; totalAmount: number; sales: Sale[] }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sales = await Sale.findAll({
      where: {
        saleDate: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }],
      order: [['saleDate', 'DESC']],
    });

    const totalAmount = sales.reduce((acc, curr) => acc + Number(curr.grandTotal), 0);
    return {
      totalSales: sales.length,
      totalAmount,
      sales,
    };
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
      const paymentStatus = req.query.status as string | undefined;

      const sales = await SaleGetter.fetchAll({ customerId, paymentStatus });
      res.status(200).json({
        success: true,
        count: sales.length,
        data: sales,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid sale ID' });
        return;
      }

      const sale = await SaleGetter.fetchById(id);
      if (!sale) {
        res.status(404).json({ success: false, message: `Sale with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTodaySummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await SaleGetter.fetchTodaySales();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

