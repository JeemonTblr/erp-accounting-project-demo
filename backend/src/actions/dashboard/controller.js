const { SaleGetter } = require("../sale/getter");
const { ExpenseGetter } = require("../expense/getter");
const { PurchaseGetter } = require("../purchase/getter");
const { ErpReportsService } = require("../../helpers/erpnext/reports.service");
const { AccountingAdapter } = require("../../plugins/accounting/index");
class DashboardController {
  static async getSummary(_req, res, next) {
    try {
      const [todaySales, todayExpenses, todayPurchases] = await Promise.all([
        SaleGetter.fetchTodaySales().catch(() => ({ totalSales: 0, totalAmount: 0, sales: [] })),
        ExpenseGetter.fetchTodayExpenses().catch(() => ({ totalExpenses: 0, totalAmount: 0 })),
        PurchaseGetter.fetchTodayPurchases().catch(() => ({ totalPurchases: 0, totalAmount: 0 }))
      ]);
      const erpMetrics = await AccountingAdapter.getDashboardFinancialMetrics();
      res.status(200).json({
        success: true,
        data: {
          today: {
            salesCount: todaySales.totalSales,
            salesAmount: todaySales.totalAmount,
            expensesCount: todayExpenses.totalExpenses,
            expensesAmount: todayExpenses.totalAmount,
            purchasesCount: todayPurchases.totalPurchases,
            purchasesAmount: todayPurchases.totalAmount
          },
          accounting: {
            cashBalance: erpMetrics.cashBalance,
            bankBalance: erpMetrics.bankBalance,
            upiBalance: erpMetrics.upiBalance,
            monthlyRevenue: erpMetrics.totalRevenue,
            monthlyExpenses: erpMetrics.totalExpenses,
            monthlyProfitLoss: erpMetrics.netProfitLoss,
            grossProfit: erpMetrics.grossProfit !== undefined ? erpMetrics.grossProfit : null,
            varianceVsLastMonth: erpMetrics.varianceVsLastMonth !== undefined ? erpMetrics.varianceVsLastMonth : null,
            monthlyCharts: erpMetrics.monthlyCharts || null,
            recentDayBook: erpMetrics.recentDayBook || null,
            customerOutstanding: erpMetrics.customerOutstanding,
            supplierOutstanding: erpMetrics.supplierOutstanding,
            source: erpMetrics.source,
            asOf: erpMetrics.asOf,
            isErpAccounting: AccountingAdapter.isErpAccounting(),
            mode: AccountingAdapter.getActivePluginInfo().mode,
            providerName: AccountingAdapter.getActivePluginInfo().name,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  DashboardController,
};
