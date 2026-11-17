const { Expense } = require("../../models/expense.model");
class ExpenseSetter {
  static generateExpenseNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `EXP-${(/* @__PURE__ */ new Date()).getFullYear()}-${timestamp}${random}`;
  }
  static async createExpense(data) {
    const expenseNumber = this.generateExpenseNumber();
    return Expense.create({
      expenseNumber,
      title: data.title.trim(),
      category: data.category.trim(),
      amount: Number(data.amount),
      expenseDate: data.expenseDate || /* @__PURE__ */ new Date(),
      paymentMethod: data.paymentMethod || "CASH",
      description: data.description ? data.description.trim() : null,
      referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null
    });
  }
  static async updateExpense(id, data) {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      const error = new Error(`Expense with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.title !== void 0) expense.title = data.title.trim();
    if (data.category !== void 0) expense.category = data.category.trim();
    if (data.amount !== void 0) expense.amount = Number(data.amount);
    if (data.expenseDate !== void 0) expense.expenseDate = data.expenseDate;
    if (data.paymentMethod !== void 0) expense.paymentMethod = data.paymentMethod;
    if (data.description !== void 0) expense.description = data.description;
    if (data.referenceNumber !== void 0) expense.referenceNumber = data.referenceNumber;
    if (data.erpnextJournalEntryId !== void 0) expense.erpnextJournalEntryId = data.erpnextJournalEntryId;
    if (data.erpnextPurchaseInvoiceId !== void 0) expense.erpnextPurchaseInvoiceId = data.erpnextPurchaseInvoiceId;
    await expense.save();
    return expense;
  }
  static async setErpnextReferences(id, erpnextJournalEntryId, erpnextPurchaseInvoiceId) {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error(`Expense with ID ${id} not found.`);
    expense.erpnextJournalEntryId = erpnextJournalEntryId;
    if (erpnextPurchaseInvoiceId !== void 0) {
      expense.erpnextPurchaseInvoiceId = erpnextPurchaseInvoiceId;
    }
    await expense.save();
    return expense;
  }
  static async deleteExpense(id) {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      const error = new Error(`Expense with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await expense.destroy();
    return true;
  }
}
module.exports = {
  ExpenseSetter,
};
