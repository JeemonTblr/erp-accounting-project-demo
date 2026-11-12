import { Request, Response, NextFunction } from 'express';
import { SaleGetter } from '../sale/getter';
import { ExpenseGetter } from '../expense/getter';
import { PurchaseGetter } from '../purchase/getter';
import { ErpReportsService } from '../../helpers/erpnext/reports.service';

export class DashboardController {
  public static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Fetch today's transactional activities from MariaDB
      const [todaySales, todayExpenses, todayPurchases] = await Promise.all([
        SaleGetter.fetchTodaySales().catch(() => ({ totalSales: 0, totalAmount: 0, sales: [] })),
        ExpenseGetter.fetchTodayExpenses().catch(() => ({ totalExpenses: 0, totalAmount: 0 })),
        PurchaseGetter.fetchTodayPurchases().catch(() => ({ totalPurchases: 0, totalAmount: 0 })),
      ]);

      // 2. Fetch official financial balances and P&L from ERPNext Accounting
      const erpMetrics = await ErpReportsService.getDashboardMetrics();

      res.status(200).json({
        success: true,
        data: {
          today: {
            salesCount: todaySales.totalSales,
            salesAmount: todaySales.totalAmount,
            expensesCount: todayExpenses.totalExpenses,
            expensesAmount: todayExpenses.totalAmount,
            purchasesCount: todayPurchases.totalPurchases,
            purchasesAmount: todayPurchases.totalAmount,
          },
          accounting: {
            cashBalance: erpMetrics.cashBalance,
            bankBalance: erpMetrics.bankBalance,
            upiBalance: erpMetrics.upiBalance,
            monthlyRevenue: erpMetrics.totalRevenue,
            monthlyExpenses: erpMetrics.totalExpenses,
            monthlyProfitLoss: erpMetrics.netProfitLoss,
            customerOutstanding: erpMetrics.customerOutstanding,
            supplierOutstanding: erpMetrics.supplierOutstanding,
            source: erpMetrics.source,
            asOf: erpMetrics.asOf,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

