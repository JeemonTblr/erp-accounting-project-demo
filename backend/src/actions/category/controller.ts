import { Request, Response, NextFunction } from 'express';
import { CategorySetter } from './setter';
import { Category } from '../../models/category.model';

export class CategoryController {
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, isActive } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Category name is required.' });
        return;
      }

      const existing = await Category.findOne({ where: { name: name.trim() } });
      if (existing) {
        res.status(409).json({ success: false, message: `Category "${name}" already exists.` });
        return;
      }

      const category = await CategorySetter.createCategory({ name, description, isActive });
      res.status(201).json({
        success: true,
        message: 'Category created successfully.',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      const updated = await CategorySetter.updateCategory(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Category updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid category ID' });
        return;
      }

      await CategorySetter.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: `Category with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}

