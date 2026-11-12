import { Expense } from '../../models/expense.model';

export class ExpenseSetter {
  public static generateExpenseNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `EXP-${new Date().getFullYear()}-${timestamp}${random}`;
  }

  public static async createExpense(data: {
    title: string;
    category: string;
    amount: number;
    expenseDate?: Date;
    paymentMethod?: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
    description?: string | null;
    referenceNumber?: string | null;
  }): Promise<Expense> {
    const expenseNumber = this.generateExpenseNumber();
    return Expense.create({
      expenseNumber,
      title: data.title.trim(),
      category: data.category.trim(),
      amount: Number(data.amount),
      expenseDate: data.expenseDate || new Date(),
      paymentMethod: data.paymentMethod || 'CASH',
      description: data.description ? data.description.trim() : null,
      referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null,
    });
  }

  public static async updateExpense(
    id: number,
    data: Partial<{
      title: string;
      category: string;
      amount: number;
      expenseDate: Date;
      paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
      description: string | null;
      referenceNumber: string | null;
      erpnextJournalEntryId: string | null;
      erpnextPurchaseInvoiceId: string | null;
    }>
  ): Promise<Expense> {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      const error = new Error(`Expense with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.title !== undefined) expense.title = data.title.trim();
    if (data.category !== undefined) expense.category = data.category.trim();
    if (data.amount !== undefined) expense.amount = Number(data.amount);
    if (data.expenseDate !== undefined) expense.expenseDate = data.expenseDate;
    if (data.paymentMethod !== undefined) expense.paymentMethod = data.paymentMethod;
    if (data.description !== undefined) expense.description = data.description;
    if (data.referenceNumber !== undefined) expense.referenceNumber = data.referenceNumber;
    if (data.erpnextJournalEntryId !== undefined) expense.erpnextJournalEntryId = data.erpnextJournalEntryId;
    if (data.erpnextPurchaseInvoiceId !== undefined) expense.erpnextPurchaseInvoiceId = data.erpnextPurchaseInvoiceId;

    await expense.save();
    return expense;
  }

  public static async setErpnextReferences(
    id: number,
    erpnextJournalEntryId: string,
    erpnextPurchaseInvoiceId?: string | null
  ): Promise<Expense> {
    const expense = await Expense.findByPk(id);
    if (!expense) throw new Error(`Expense with ID ${id} not found.`);

    expense.erpnextJournalEntryId = erpnextJournalEntryId;
    if (erpnextPurchaseInvoiceId !== undefined) {
      expense.erpnextPurchaseInvoiceId = erpnextPurchaseInvoiceId;
    }
    await expense.save();
    return expense;
  }

  public static async deleteExpense(id: number): Promise<boolean> {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      const error = new Error(`Expense with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await expense.destroy();
    return true;
  }
}

