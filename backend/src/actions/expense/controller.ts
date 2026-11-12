import { Request, Response, NextFunction } from 'express';
import { ExpenseSetter } from './setter';
import { ExpenseGetter } from './getter';
import { Expense } from '../../models/expense.model';
import { ErpExpenseService } from '../../helpers/erpnext/expense.service';
import { ErpSyncSetter } from '../erp-sync/setter';

export class ExpenseController {
  /**
   * Record a shop expense: saves in MariaDB + syncs Journal Entry to ERPNext.
   */
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, category, amount, expenseDate, paymentMethod, description, referenceNumber } = req.body;

      if (!title || !category || amount === undefined) {
        res.status(400).json({
          success: false,
          message: 'Title, category, and amount are required.',
        });
        return;
      }

      // 1. Create locally in MariaDB
      const expense = await ExpenseSetter.createExpense({
        title,
        category,
        amount,
        expenseDate,
        paymentMethod,
        description,
        referenceNumber,
      });

      // 2. Initialize ERPNext Journal Entry sync log
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(expense.id),
        transactionType: 'EXPENSE_SYNC',
        erpnextDocumentType: 'Journal Entry',
        syncStatus: 'PROCESSING',
        payload: JSON.stringify({ title: expense.title, category: expense.category, amount: expense.amount }),
      });

      // 3. Attempt ERPNext Journal Entry sync
      let erpJournalEntryId: string | null = null;
      let erpSyncStatus = 'SYNCED';
      let erpSyncError: string | null = null;

      try {
        const result = await ErpExpenseService.createAndSubmitJournalEntry({
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          postingDate: expense.expenseDate
            ? new Date(expense.expenseDate).toISOString().split('T')[0]
            : undefined,
          description: expense.description || undefined,
          referenceNumber: expense.referenceNumber || expense.expenseNumber,
        });

        erpJournalEntryId = result.journalEntryName;
        expense.erpnextJournalEntryId = erpJournalEntryId;
        await expense.save();

        await ErpSyncSetter.markSynced(syncLog.id, erpJournalEntryId);
      } catch (err: unknown) {
        erpSyncStatus = 'FAILED';
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }

      const refreshed = await ExpenseGetter.fetchById(expense.id);
      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully.',
        data: refreshed,
        erpSync: {
          status: erpSyncStatus,
          erpnextJournalEntryId: erpJournalEntryId,
          error: erpSyncError,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual / Retry ERPNext Sync for a specific Expense.
   */
  public static async syncToErp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid expense ID' });
        return;
      }

      const expense = await ExpenseGetter.fetchById(id);
      if (!expense) {
        res.status(404).json({ success: false, message: `Expense ${id} not found` });
        return;
      }

      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(expense.id),
        transactionType: 'EXPENSE_SYNC',
        erpnextDocumentType: 'Journal Entry',
        syncStatus: 'PROCESSING',
      });

      try {
        const result = await ErpExpenseService.createAndSubmitJournalEntry({
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          postingDate: expense.expenseDate
            ? new Date(expense.expenseDate).toISOString().split('T')[0]
            : undefined,
          description: expense.description || undefined,
          referenceNumber: expense.referenceNumber || expense.expenseNumber,
        });

        expense.erpnextJournalEntryId = result.journalEntryName;
        await expense.save();
        await ErpSyncSetter.markSynced(syncLog.id, result.journalEntryName);

        res.status(200).json({
          success: true,
          message: 'Expense successfully synced to ERPNext.',
          erpnextJournalEntryId: result.journalEntryName,
          data: expense,
        });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid expense ID' });
        return;
      }

      const updated = await ExpenseSetter.updateExpense(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Expense updated successfully.',
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
        res.status(400).json({ success: false, message: 'Invalid expense ID' });
        return;
      }

      await ExpenseSetter.deleteExpense(id);
      res.status(200).json({
        success: true,
        message: `Expense with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
