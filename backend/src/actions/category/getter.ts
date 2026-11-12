import { Request, Response, NextFunction } from 'express';
import { Category } from '../../models/category.model';

export class CategoryGetter {
  public static async fetchById(id: number): Promise<Category | null> {
    return Category.findByPk(id);
  }

  public static async fetchAll(): Promise<Category[]> {
    return Category.findAll({
      order: [['name', 'ASC']],
    });
  }

  public static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryGetter.fetchAll();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      const category = await CategoryGetter.fetchById(id);
      if (!category) {
        res.status(404).json({ success: false, message: `Category with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }
}

