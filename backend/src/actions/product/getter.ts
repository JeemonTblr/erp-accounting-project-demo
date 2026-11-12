import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { Category } from '../../models/category.model';
import { sequelize } from '../../config/database';

export class ProductGetter {
  public static async fetchById(id: number): Promise<Product | null> {
    return Product.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: ProductVariant, as: 'variants' },
      ],
    });
  }

  public static async fetchBySku(sku: string): Promise<Product | null> {
    return Product.findOne({
      where: { sku: sku.trim().toUpperCase() },
      include: [{ model: ProductVariant, as: 'variants' }],
    });
  }

  public static async fetchAll(options?: {
    categoryId?: number;
    search?: string;
    activeOnly?: boolean;
  }): Promise<Product[]> {
    const where: Record<string, unknown> = {};

    if (options?.activeOnly) {
      where.isActive = true;
    }
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${options.search}%` } },
        { sku: { [Op.like]: `%${options.search}%` } },
        { brand: { [Op.like]: `%${options.search}%` } },
      ];
    }

    return Product.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [['name', 'ASC']],
    });
  }

  public static async fetchLowStock(): Promise<Product[]> {
    return Product.findAll({
      where: sequelize.where(
        sequelize.col('stock_quantity'),
        '<=',
        sequelize.col('reorder_level')
      ),
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['stockQuantity', 'ASC']],
    });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
      const search = req.query.search ? (req.query.search as string) : undefined;
      const activeOnly = req.query.active === 'true';

      const products = await ProductGetter.fetchAll({ categoryId, search, activeOnly });
      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid product ID' });
        return;
      }

      const product = await ProductGetter.fetchById(id);
      if (!product) {
        res.status(404).json({ success: false, message: `Product with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getLowStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lowStockProducts = await ProductGetter.fetchLowStock();
      res.status(200).json({
        success: true,
        count: lowStockProducts.length,
        data: lowStockProducts,
      });
    } catch (error) {
      next(error);
    }
  }
}

