import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../../models/supplier.model';

export class SupplierGetter {
  public static async fetchById(id: number): Promise<Supplier | null> {
    return Supplier.findByPk(id);
  }

  public static async fetchAll(options?: { activeOnly?: boolean }): Promise<Supplier[]> {
    const where = options?.activeOnly ? { isActive: true } : {};
    return Supplier.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  public static async fetchByErpId(erpnextSupplierId: string): Promise<Supplier | null> {
    return Supplier.findOne({ where: { erpnextSupplierId } });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const suppliers = await SupplierGetter.fetchAll({ activeOnly });
      res.status(200).json({
        success: true,
        count: suppliers.length,
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid supplier ID' });
        return;
      }

      const supplier = await SupplierGetter.fetchById(id);
      if (!supplier) {
        res.status(404).json({ success: false, message: `Supplier with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }
}

