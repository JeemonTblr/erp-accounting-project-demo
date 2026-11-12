import { Category } from '../../models/category.model';

export class CategorySetter {
  public static async createCategory(data: {
    name: string;
    description?: string | null;
    isActive?: boolean;
  }): Promise<Category> {
    return Category.create({
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  public static async updateCategory(
    id: number,
    data: {
      name?: string;
      description?: string | null;
      isActive?: boolean;
    }
  ): Promise<Category> {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error(`Category with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) category.name = data.name.trim();
    if (data.description !== undefined) category.description = data.description ? data.description.trim() : null;
    if (data.isActive !== undefined) category.isActive = data.isActive;

    await category.save();
    return category;
  }

  public static async deleteCategory(id: number): Promise<boolean> {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error(`Category with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await category.destroy();
    return true;
  }
}

