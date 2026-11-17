const { Category } = require("../../models/category.model");
class CategorySetter {
  static async createCategory(data) {
    return Category.create({
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
      isActive: data.isActive !== void 0 ? data.isActive : true
    });
  }
  static async updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error(`Category with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== void 0) category.name = data.name.trim();
    if (data.description !== void 0) category.description = data.description ? data.description.trim() : null;
    if (data.isActive !== void 0) category.isActive = data.isActive;
    await category.save();
    return category;
  }
  static async deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) {
      const error = new Error(`Category with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await category.destroy();
    return true;
  }
}
module.exports = {
  CategorySetter,
};
