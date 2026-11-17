const { ExpenseSetter } = require("./setter");
const { ExpenseGetter } = require("./getter");
const { ErpExpenseService } = require("../../helpers/erpnext/expense.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
const { AccountingAdapter } = require("../../plugins/accounting/index");
class ExpenseController {
  /**
   * Record a shop expense: saves in MariaDB + syncs Journal Entry to ERPNext.
   */
  static async add(req, res, next) {
    try {
      const { title, category, amount, expenseDate, paymentMethod, description, referenceNumber } = req.body;
      if (!title || !category || amount === void 0) {
        res.status(400).json({
          success: false,
          message: "Title, category, and amount are required."
        });
        return;
      }
      const expense = await ExpenseSetter.createExpense({
        title,
        category,
        amount,
        expenseDate,
        paymentMethod,
        description,
        referenceNumber
      });
      let erpJournalEntryId = null;
      let erpSyncStatus = "SYNCED";
      let erpSyncError = null;

      // ── EAccounting Plugin Branch ──────────────────────────────────────────
      if (!AccountingAdapter.isErpAccounting()) {
        const eaccSyncLog = await ErpSyncSetter.createLog({
          localTransactionId: String(expense.id),
          transactionType: "EXPENSE_SYNC",
          erpnextDocumentType: "EAccounting Expense",
          syncStatus: "PROCESSING",
          payload: JSON.stringify({ title: expense.title, category: expense.category, amount: expense.amount }),
        });
        try {
          const eaccResult = await AccountingAdapter.syncExpense(expense);
          if (eaccResult && eaccResult.success) {
            await ErpSyncSetter.markSynced(eaccSyncLog.id, eaccResult.eaccDocId);
            erpJournalEntryId = eaccResult.eaccDocId;
          } else {
            erpSyncStatus = "FAILED";
            erpSyncError = eaccResult?.error || "EAccounting expense sync failed";
            await ErpSyncSetter.markFailed(eaccSyncLog.id, erpSyncError);
          }
        } catch (eaccErr) {
          erpSyncStatus = "FAILED";
          erpSyncError = eaccErr instanceof Error ? eaccErr.message : String(eaccErr);
          await ErpSyncSetter.markFailed(eaccSyncLog.id, erpSyncError);
        }
      } else {
      // ── Original ERPNext Sync Block (unchanged) ────────────────────────────
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(expense.id),
        transactionType: "EXPENSE_SYNC",
        erpnextDocumentType: "Journal Entry",
        syncStatus: "PROCESSING",
        payload: JSON.stringify({ title: expense.title, category: expense.category, amount: expense.amount })
      });
      try {
        const result = await ErpExpenseService.createAndSubmitJournalEntry({
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          postingDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : void 0,
          description: expense.description || void 0,
          referenceNumber: expense.referenceNumber || expense.expenseNumber
        });
        erpJournalEntryId = result.journalEntryName;
        expense.erpnextJournalEntryId = erpJournalEntryId;
        await expense.save();
        await ErpSyncSetter.markSynced(syncLog.id, erpJournalEntryId);
      } catch (err) {
        erpSyncStatus = "FAILED";
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }
      } // end else (ERPNext sync block)
      const refreshed = await ExpenseGetter.fetchById(expense.id);
      res.status(201).json({
        success: true,
        message: "Expense recorded successfully.",
        data: refreshed,
        erpSync: {
          status: erpSyncStatus,
          erpnextJournalEntryId: erpJournalEntryId,
          error: erpSyncError
        }
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Manual / Retry ERPNext Sync for a specific Expense.
   */
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid expense ID" });
        return;
      }
      const expense = await ExpenseGetter.fetchById(id);
      if (!expense) {
        res.status(404).json({ success: false, message: `Expense ${id} not found` });
        return;
      }
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(expense.id),
        transactionType: "EXPENSE_SYNC",
        erpnextDocumentType: "Journal Entry",
        syncStatus: "PROCESSING"
      });
      try {
        const result = await ErpExpenseService.createAndSubmitJournalEntry({
          title: expense.title,
          category: expense.category,
          amount: expense.amount,
          paymentMethod: expense.paymentMethod,
          postingDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split("T")[0] : void 0,
          description: expense.description || void 0,
          referenceNumber: expense.referenceNumber || expense.expenseNumber
        });
        expense.erpnextJournalEntryId = result.journalEntryName;
        await expense.save();
        await ErpSyncSetter.markSynced(syncLog.id, result.journalEntryName);
        res.status(200).json({
          success: true,
          message: "Expense successfully synced to ERPNext.",
          erpnextJournalEntryId: result.journalEntryName,
          data: expense
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`
        });
      }
    } catch (error) {
      next(error);
    }
  }
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid expense ID" });
        return;
      }
      const updated = await ExpenseSetter.updateExpense(id, req.body);
      res.status(200).json({
        success: true,
        message: "Expense updated successfully.",
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid expense ID" });
        return;
      }
      await ExpenseSetter.deleteExpense(id);
      res.status(200).json({
        success: true,
        message: `Expense with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ExpenseController,
};
