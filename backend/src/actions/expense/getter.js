const { Op } = require("sequelize");
const { Expense } = require("../../models/expense.model");
class ExpenseGetter {
  static async fetchById(id) {
    return Expense.findByPk(id);
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.category) {
      where.category = options.category;
    }
    if (options?.paymentMethod) {
      where.paymentMethod = options.paymentMethod;
    }
    if (options?.startDate || options?.endDate) {
      const dateFilter = {};
      if (options.startDate) dateFilter[Op.gte] = options.startDate;
      if (options.endDate) dateFilter[Op.lte] = options.endDate;
      where.expenseDate = dateFilter;
    }
    return Expense.findAll({
      where,
      order: [["expenseDate", "DESC"]]
    });
  }
  static async fetchTodayExpenses() {
    const startOfDay = /* @__PURE__ */ new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = /* @__PURE__ */ new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const expenses = await Expense.findAll({
      where: {
        expenseDate: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });
    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);
    return {
      totalExpenses: expenses.length,
      totalAmount
    };
  }
  static async getAll(req, res, next) {
    try {
      const category = req.query.category;
      const paymentMethod = req.query.method;
      const expenses = await ExpenseGetter.fetchAll({ category, paymentMethod });
      res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid expense ID" });
        return;
      }
      const expense = await ExpenseGetter.fetchById(id);
      if (!expense) {
        res.status(404).json({ success: false, message: `Expense with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: expense
      });
    } catch (error) {
      next(error);
    }
  }
  static async getTodaySummary(_req, res, next) {
    try {
      const summary = await ExpenseGetter.fetchTodayExpenses();
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ExpenseGetter,
};
