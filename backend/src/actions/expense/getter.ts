import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Expense } from '../../models/expense.model';

export class ExpenseGetter {
  public static async fetchById(id: number): Promise<Expense | null> {
    return Expense.findByPk(id);
  }

  public static async fetchAll(options?: {
    category?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    const where: Record<string, unknown> = {};

    if (options?.category) {
      where.category = options.category;
    }
    if (options?.paymentMethod) {
      where.paymentMethod = options.paymentMethod;
    }
    if (options?.startDate || options?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (options.startDate) dateFilter[Op.gte as unknown as string] = options.startDate;
      if (options.endDate) dateFilter[Op.lte as unknown as string] = options.endDate;
      where.expenseDate = dateFilter;
    }

    return Expense.findAll({
      where,
      order: [['expenseDate', 'DESC']],
    });
  }

  public static async fetchTodayExpenses(): Promise<{ totalExpenses: number; totalAmount: number }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const expenses = await Expense.findAll({
      where: {
        expenseDate: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    return {
      totalExpenses: expenses.length,
      totalAmount,
    };
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const paymentMethod = req.query.method as string | undefined;

      const expenses = await ExpenseGetter.fetchAll({ category, paymentMethod });
      res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid expense ID' });
        return;
      }

      const expense = await ExpenseGetter.fetchById(id);
      if (!expense) {
        res.status(404).json({ success: false, message: `Expense with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTodaySummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await ExpenseGetter.fetchTodayExpenses();
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

