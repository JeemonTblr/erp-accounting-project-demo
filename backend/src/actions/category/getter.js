const { Category } = require("../../models/category.model");
class CategoryGetter {
  static async fetchById(id) {
    return Category.findByPk(id);
  }
  static async fetchAll() {
    return Category.findAll({
      order: [["name", "ASC"]]
    });
  }
  static async getAll(_req, res, next) {
    try {
      const categories = await CategoryGetter.fetchAll();
      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid category ID" });
        return;
      }
      const category = await CategoryGetter.fetchById(id);
      if (!category) {
        res.status(404).json({ success: false, message: `Category with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  CategoryGetter,
};
