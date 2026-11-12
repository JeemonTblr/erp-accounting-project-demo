import { Request, Response, NextFunction } from 'express';
import { Customer } from '../../models/customer.model';

export class CustomerGetter {
  public static async fetchById(id: number): Promise<Customer | null> {
    return Customer.findByPk(id);
  }

  public static async fetchAll(options?: { activeOnly?: boolean }): Promise<Customer[]> {
    const where = options?.activeOnly ? { isActive: true } : {};
    return Customer.findAll({
      where,
      order: [['name', 'ASC']],
    });
  }

  public static async fetchByErpId(erpnextCustomerId: string): Promise<Customer | null> {
    return Customer.findOne({ where: { erpnextCustomerId } });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeOnly = req.query.active === 'true';
      const customers = await CustomerGetter.fetchAll({ activeOnly });
      res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid customer ID' });
        return;
      }

      const customer = await CustomerGetter.fetchById(id);
      if (!customer) {
        res.status(404).json({ success: false, message: `Customer with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }
}

