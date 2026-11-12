import { Request, Response, NextFunction } from 'express';
import { ErpReportsService } from '../../helpers/erpnext/reports.service';
import { Sale } from '../../models/sale.model';
import { SaleItem } from '../../models/sale-item.model';
import { Product } from '../../models/product.model';
import { Expense } from '../../models/expense.model';
import { Purchase } from '../../models/purchase.model';
import { Op } from 'sequelize';

export class ReportsController {
  public static async getProfitAndLoss(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.from_date as string | undefined;
      const toDate = req.query.to_date as string | undefined;
      const periodicity = req.query.periodicity as 'Monthly' | 'Quarterly' | 'Yearly' | undefined;

      const report = await ErpReportsService.getProfitAndLoss({ fromDate, toDate, periodicity });
      res.status(200).json({
        success: true,
        reportName: 'Profit and Loss Statement',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getBalanceSheet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.from_date as string | undefined;
      const toDate = req.query.to_date as string | undefined;

      const report = await ErpReportsService.getBalanceSheet({ fromDate, toDate });
      res.status(200).json({
        success: true,
        reportName: 'Balance Sheet',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getGeneralLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.from_date as string | undefined;
      const toDate = req.query.to_date as string | undefined;
      const account = req.query.account as string | undefined;
      const party = req.query.party as string | undefined;

      const report = await ErpReportsService.getGeneralLedger({ fromDate, toDate, account, party });
      res.status(200).json({
        success: true,
        reportName: 'General Ledger',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTrialBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query.from_date as string | undefined;
      const toDate = req.query.to_date as string | undefined;

      const report = await ErpReportsService.getTrialBalance({ fromDate, toDate });
      res.status(200).json({
        success: true,
        reportName: 'Trial Balance',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAccountsReceivable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = req.query.customer as string | undefined;
      const reportDate = req.query.report_date as string | undefined;

      const report = await ErpReportsService.getAccountsReceivable({ customer, reportDate });
      res.status(200).json({
        success: true,
        reportName: 'Accounts Receivable',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAccountsPayable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const supplier = req.query.supplier as string | undefined;
      const reportDate = req.query.report_date as string | undefined;

      const report = await ErpReportsService.getAccountsPayable({ supplier, reportDate });
      res.status(200).json({
        success: true,
        reportName: 'Accounts Payable',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStockBalanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const itemCode = req.query.item_code as string | undefined;
      const warehouse = req.query.warehouse as string | undefined;

      const report = await ErpReportsService.getStockBalanceReport({ itemCode, warehouse });
      res.status(200).json({
        success: true,
        reportName: 'Stock Balance Report',
        source: 'ERPNext Accounting Module',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Daily Sales and Profit & Loss Report
   * Tracks daily sales, cost of goods sold (COGS), gross profit, operating expenses, and net profit or loss.
   */
  public static async getDailySalesAndPnL(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = (req.query.from_date as string) || `${new Date().getFullYear()}-01-01`;
      const toDate = (req.query.to_date as string) || new Date().toISOString().split('T')[0];

      // 1. Fetch sales within range
      const sales = await Sale.findAll({
        where: {
          saleDate: {
            [Op.between]: [new Date(`${fromDate} 00:00:00`), new Date(`${toDate} 23:59:59`)],
          },
        },
        include: [
          {
            model: SaleItem,
            as: 'items',
            include: [{ model: Product, as: 'product' }],
          },
        ],
        order: [['saleDate', 'ASC']],
      });

      // 2. Fetch expenses within range
      const expenses = await Expense.findAll({
        where: {
          expenseDate: {
            [Op.between]: [new Date(`${fromDate} 00:00:00`), new Date(`${toDate} 23:59:59`)],
          },
        },
        order: [['expenseDate', 'ASC']],
      });

      // 3. Group by date string YYYY-MM-DD
      const dailyMap: Record<
        string,
        {
          date: string;
          ordersCount: number;
          salesRevenue: number;
          cogs: number;
          grossProfit: number;
          grossMarginPercent: number;
          operatingExpenses: number;
          netProfitLoss: number;
        }
      > = {};

      for (const s of sales) {
        const dStr = new Date(s.saleDate).toISOString().split('T')[0];
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            ordersCount: 0,
            salesRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPercent: 0,
            operatingExpenses: 0,
            netProfitLoss: 0,
          };
        }

        dailyMap[dStr].ordersCount += 1;
        const revenue = Number(s.subtotal || s.grandTotal);
        dailyMap[dStr].salesRevenue += revenue;

        // Calculate COGS
        const items = (s as unknown as { items?: Array<{ quantity: number; product?: { purchasePrice: number } }> }).items || [];
        for (const it of items) {
          const cost = Number(it.product?.purchasePrice || 0);
          dailyMap[dStr].cogs += it.quantity * cost;
        }
      }

      for (const e of expenses) {
        const dStr = new Date(e.expenseDate).toISOString().split('T')[0];
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            ordersCount: 0,
            salesRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPercent: 0,
            operatingExpenses: 0,
            netProfitLoss: 0,
          };
        }
        dailyMap[dStr].operatingExpenses += Number(e.amount);
      }

      // Compute calculated fields
      const rows = Object.values(dailyMap)
        .map((row) => {
          row.grossProfit = row.salesRevenue - row.cogs;
          row.grossMarginPercent = row.salesRevenue > 0 ? Number(((row.grossProfit / row.salesRevenue) * 100).toFixed(1)) : 0;
          row.netProfitLoss = row.grossProfit - row.operatingExpenses;
          return row;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      const totals = rows.reduce(
        (acc, r) => {
          acc.ordersCount += r.ordersCount;
          acc.salesRevenue += r.salesRevenue;
          acc.cogs += r.cogs;
          acc.grossProfit += r.grossProfit;
          acc.operatingExpenses += r.operatingExpenses;
          acc.netProfitLoss += r.netProfitLoss;
          return acc;
        },
        {
          ordersCount: 0,
          salesRevenue: 0,
          cogs: 0,
          grossProfit: 0,
          grossMarginPercent: 0,
          operatingExpenses: 0,
          netProfitLoss: 0,
        }
      );

      totals.grossMarginPercent =
        totals.salesRevenue > 0 ? Number(((totals.grossProfit / totals.salesRevenue) * 100).toFixed(1)) : 0;

      res.status(200).json({
        success: true,
        reportName: 'Daily Sales & Profit and Loss (COGS)',
        source: 'Textile Shop ERP & ERPNext General Ledger',
        fromDate,
        toDate,
        totals,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Daily Income and Expenses Report
   * Record and manage daily sales receipts, purchases, and operational expenses.
   */
  public static async getDailyIncomeAndExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = (req.query.from_date as string) || `${new Date().getFullYear()}-01-01`;
      const toDate = (req.query.to_date as string) || new Date().toISOString().split('T')[0];

      const [sales, purchases, expenses] = await Promise.all([
        Sale.findAll({
          where: {
            saleDate: {
              [Op.between]: [new Date(`${fromDate} 00:00:00`), new Date(`${toDate} 23:59:59`)],
            },
          },
          order: [['saleDate', 'ASC']],
        }),
        Purchase.findAll({
          where: {
            purchaseDate: {
              [Op.between]: [new Date(`${fromDate} 00:00:00`), new Date(`${toDate} 23:59:59`)],
            },
          },
          order: [['purchaseDate', 'ASC']],
        }),
        Expense.findAll({
          where: {
            expenseDate: {
              [Op.between]: [new Date(`${fromDate} 00:00:00`), new Date(`${toDate} 23:59:59`)],
            },
          },
          order: [['expenseDate', 'ASC']],
        }),
      ]);

      const dailyMap: Record<
        string,
        {
          date: string;
          cashSales: number;
          bankSales: number;
          creditSales: number;
          totalSales: number;
          purchasesPaid: number;
          operatingExpenses: number;
          netCashFlow: number;
        }
      > = {};

      const getOrCreate = (dStr: string) => {
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            cashSales: 0,
            bankSales: 0,
            creditSales: 0,
            totalSales: 0,
            purchasesPaid: 0,
            operatingExpenses: 0,
            netCashFlow: 0,
          };
        }
        return dailyMap[dStr];
      };

      for (const s of sales) {
        const dStr = new Date(s.saleDate).toISOString().split('T')[0];
        const row = getOrCreate(dStr);
        const amount = Number(s.grandTotal);
        if (s.paymentMethod === 'CASH') {
          row.cashSales += amount;
        } else {
          row.bankSales += amount;
        }
        if (s.paymentStatus === 'UNPAID' || s.paymentStatus === 'PARTIAL') {
          const unpaid = amount - Number(s.paidAmount || 0);
          row.creditSales += unpaid;
        }
        row.totalSales += amount;
      }

      for (const p of purchases) {
        const dStr = new Date(p.purchaseDate).toISOString().split('T')[0];
        const row = getOrCreate(dStr);
        row.purchasesPaid += Number(p.paidAmount || p.grandTotal);
      }

      for (const e of expenses) {
        const dStr = new Date(e.expenseDate).toISOString().split('T')[0];
        const row = getOrCreate(dStr);
        row.operatingExpenses += Number(e.amount);
      }

      const rows = Object.values(dailyMap)
        .map((row) => {
          row.netCashFlow = (row.cashSales + row.bankSales) - (row.purchasesPaid + row.operatingExpenses);
          return row;
        })
        .sort((a, b) => a.date.localeCompare(b.date));

      const totals = rows.reduce(
        (acc, r) => {
          acc.cashSales += r.cashSales;
          acc.bankSales += r.bankSales;
          acc.creditSales += r.creditSales;
          acc.totalSales += r.totalSales;
          acc.purchasesPaid += r.purchasesPaid;
          acc.operatingExpenses += r.operatingExpenses;
          acc.netCashFlow += r.netCashFlow;
          return acc;
        },
        {
          cashSales: 0,
          bankSales: 0,
          creditSales: 0,
          totalSales: 0,
          purchasesPaid: 0,
          operatingExpenses: 0,
          netCashFlow: 0,
        }
      );

      res.status(200).json({
        success: true,
        reportName: 'Daily Income and Expenses',
        source: 'Shop Operations & ERPNext Vouchers',
        fromDate,
        toDate,
        totals,
        data: rows,
      });
    } catch (error) {
      next(error);
    }
  }
}

