import { Router } from 'express';
import { ReportsController } from './controller';
import { authenticateToken } from '../../helpers/middleware/auth.middleware';

const router = Router();

// Protected: Official P&L Statement from ERPNext
router.get('/profit-and-loss', authenticateToken, ReportsController.getProfitAndLoss);

// Protected: Official Balance Sheet from ERPNext
router.get('/balance-sheet', authenticateToken, ReportsController.getBalanceSheet);

// Protected: Official General Ledger from ERPNext
router.get('/general-ledger', authenticateToken, ReportsController.getGeneralLedger);

// Protected: Official Trial Balance from ERPNext
router.get('/trial-balance', authenticateToken, ReportsController.getTrialBalance);

// Protected: Official Accounts Receivable from ERPNext
router.get('/accounts-receivable', authenticateToken, ReportsController.getAccountsReceivable);

// Protected: Official Accounts Payable from ERPNext
router.get('/accounts-payable', authenticateToken, ReportsController.getAccountsPayable);

// Protected: Official Stock Balance Report from ERPNext
router.get('/stock-balance', authenticateToken, ReportsController.getStockBalanceReport);

// Protected: Daily Sales & Profit & Loss Report (with COGS and Gross Margin)
router.get('/daily-sales-pnl', authenticateToken, ReportsController.getDailySalesAndPnL);

// Protected: Daily Income & Expenses Report (Cash Flow breakdown)
router.get('/daily-income-expenses', authenticateToken, ReportsController.getDailyIncomeAndExpenses);

export default router;

