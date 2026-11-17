const { ErpReportsService } = require("../../helpers/erpnext/reports.service");
const { AccountingAdapter } = require("../../plugins/accounting/index");
const { Sale } = require("../../models/sale.model");
const { SaleItem } = require("../../models/sale-item.model");
const { Product } = require("../../models/product.model");
const { Expense } = require("../../models/expense.model");
const { Purchase } = require("../../models/purchase.model");
const { Op } = require("sequelize");
class ReportsController {
  static async getProfitAndLoss(req, res, next) {
    try {
      const fromDate = req.query.from_date;
      const toDate = req.query.to_date;
      const periodicity = req.query.periodicity;
      const report = await AccountingAdapter.getProfitAndLoss({ fromDate, toDate, periodicity });
      res.status(200).json({
        success: true,
        reportName: "Profit and Loss Statement",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getBalanceSheet(req, res, next) {
    try {
      const fromDate = req.query.from_date;
      const toDate = req.query.to_date;
      const report = await AccountingAdapter.getBalanceSheet({ fromDate, toDate });
      res.status(200).json({
        success: true,
        reportName: "Balance Sheet",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getGeneralLedger(req, res, next) {
    try {
      const fromDate = req.query.from_date;
      const toDate = req.query.to_date;
      const account = req.query.account;
      const party = req.query.party;
      const report = await AccountingAdapter.getGeneralLedger({ fromDate, toDate, account, party });
      res.status(200).json({
        success: true,
        reportName: "General Ledger",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getTrialBalance(req, res, next) {
    try {
      const fromDate = req.query.from_date;
      const toDate = req.query.to_date;
      const report = await AccountingAdapter.getTrialBalance({ fromDate, toDate });
      res.status(200).json({
        success: true,
        reportName: "Trial Balance",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getAccountsReceivable(req, res, next) {
    try {
      const customer = req.query.customer;
      const reportDate = req.query.report_date;
      const report = await AccountingAdapter.getAccountsReceivable({ customer, reportDate });
      res.status(200).json({
        success: true,
        reportName: "Accounts Receivable",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getAccountsPayable(req, res, next) {
    try {
      const supplier = req.query.supplier;
      const reportDate = req.query.report_date;
      const report = await AccountingAdapter.getAccountsPayable({ supplier, reportDate });
      res.status(200).json({
        success: true,
        reportName: "Accounts Payable",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  static async getStockBalanceReport(req, res, next) {
    try {
      const itemCode = req.query.item_code;
      const warehouse = req.query.warehouse;
      const report = await AccountingAdapter.getStockBalanceReport({ itemCode, warehouse });
      res.status(200).json({
        success: true,
        reportName: "Stock Balance Report",
        source: AccountingAdapter.getActivePluginInfo().source,
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Daily Sales and Profit & Loss Report
   * Tracks daily sales, cost of goods sold (COGS), gross profit, operating expenses, and net profit or loss.
   */
  static async getDailySalesAndPnL(req, res, next) {
    try {
      const fromDate = req.query.from_date || `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`;
      const toDate = req.query.to_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const sales = await Sale.findAll({
        where: {
          saleDate: {
            [Op.between]: [/* @__PURE__ */ new Date(`${fromDate} 00:00:00`), /* @__PURE__ */ new Date(`${toDate} 23:59:59`)]
          }
        },
        include: [
          {
            model: SaleItem,
            as: "items",
            include: [{ model: Product, as: "product" }]
          }
        ],
        order: [["saleDate", "ASC"]]
      });
      const expenses = await Expense.findAll({
        where: {
          expenseDate: {
            [Op.between]: [/* @__PURE__ */ new Date(`${fromDate} 00:00:00`), /* @__PURE__ */ new Date(`${toDate} 23:59:59`)]
          }
        },
        order: [["expenseDate", "ASC"]]
      });
      const dailyMap = {};
      for (const s of sales) {
        const dStr = new Date(s.saleDate).toISOString().split("T")[0];
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            ordersCount: 0,
            salesRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPercent: 0,
            operatingExpenses: 0,
            netProfitLoss: 0
          };
        }
        dailyMap[dStr].ordersCount += 1;
        const revenue = Number(s.subtotal || s.grandTotal);
        dailyMap[dStr].salesRevenue += revenue;
        const items = s.items || [];
        for (const it of items) {
          const cost = Number(it.product?.purchasePrice || 0);
          dailyMap[dStr].cogs += it.quantity * cost;
        }
      }
      for (const e of expenses) {
        const dStr = new Date(e.expenseDate).toISOString().split("T")[0];
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            ordersCount: 0,
            salesRevenue: 0,
            cogs: 0,
            grossProfit: 0,
            grossMarginPercent: 0,
            operatingExpenses: 0,
            netProfitLoss: 0
          };
        }
        dailyMap[dStr].operatingExpenses += Number(e.amount);
      }
      const rows = Object.values(dailyMap).map((row) => {
        row.grossProfit = row.salesRevenue - row.cogs;
        row.grossMarginPercent = row.salesRevenue > 0 ? Number((row.grossProfit / row.salesRevenue * 100).toFixed(1)) : 0;
        row.netProfitLoss = row.grossProfit - row.operatingExpenses;
        return row;
      }).sort((a, b) => a.date.localeCompare(b.date));
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
          netProfitLoss: 0
        }
      );
      totals.grossMarginPercent = totals.salesRevenue > 0 ? Number((totals.grossProfit / totals.salesRevenue * 100).toFixed(1)) : 0;
      res.status(200).json({
        success: true,
        reportName: "Daily Sales & Profit and Loss (COGS)",
        source: "Textile Shop ERP & ERPNext General Ledger",
        fromDate,
        toDate,
        totals,
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Daily Income and Expenses Report
   * Record and manage daily sales receipts, purchases, and operational expenses.
   */
  static async getDailyIncomeAndExpenses(req, res, next) {
    try {
      const fromDate = req.query.from_date || `${(/* @__PURE__ */ new Date()).getFullYear()}-01-01`;
      const toDate = req.query.to_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const [sales, purchases, expenses] = await Promise.all([
        Sale.findAll({
          where: {
            saleDate: {
              [Op.between]: [/* @__PURE__ */ new Date(`${fromDate} 00:00:00`), /* @__PURE__ */ new Date(`${toDate} 23:59:59`)]
            }
          },
          order: [["saleDate", "ASC"]]
        }),
        Purchase.findAll({
          where: {
            purchaseDate: {
              [Op.between]: [/* @__PURE__ */ new Date(`${fromDate} 00:00:00`), /* @__PURE__ */ new Date(`${toDate} 23:59:59`)]
            }
          },
          order: [["purchaseDate", "ASC"]]
        }),
        Expense.findAll({
          where: {
            expenseDate: {
              [Op.between]: [/* @__PURE__ */ new Date(`${fromDate} 00:00:00`), /* @__PURE__ */ new Date(`${toDate} 23:59:59`)]
            }
          },
          order: [["expenseDate", "ASC"]]
        })
      ]);
      const dailyMap = {};
      const getOrCreate = (dStr) => {
        if (!dailyMap[dStr]) {
          dailyMap[dStr] = {
            date: dStr,
            cashSales: 0,
            bankSales: 0,
            creditSales: 0,
            totalSales: 0,
            purchasesPaid: 0,
            operatingExpenses: 0,
            netCashFlow: 0
          };
        }
        return dailyMap[dStr];
      };
      for (const s of sales) {
        const dStr = new Date(s.saleDate).toISOString().split("T")[0];
        const row = getOrCreate(dStr);
        const amount = Number(s.grandTotal);
        if (s.paymentMethod === "CASH") {
          row.cashSales += amount;
        } else {
          row.bankSales += amount;
        }
        if (s.paymentStatus === "UNPAID" || s.paymentStatus === "PARTIAL") {
          const unpaid = amount - Number(s.paidAmount || 0);
          row.creditSales += unpaid;
        }
        row.totalSales += amount;
      }
      for (const p of purchases) {
        const dStr = new Date(p.purchaseDate).toISOString().split("T")[0];
        const row = getOrCreate(dStr);
        row.purchasesPaid += Number(p.paidAmount || p.grandTotal);
      }
      for (const e of expenses) {
        const dStr = new Date(e.expenseDate).toISOString().split("T")[0];
        const row = getOrCreate(dStr);
        row.operatingExpenses += Number(e.amount);
      }
      const rows = Object.values(dailyMap).map((row) => {
        row.netCashFlow = row.cashSales + row.bankSales - (row.purchasesPaid + row.operatingExpenses);
        return row;
      }).sort((a, b) => a.date.localeCompare(b.date));
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
          netCashFlow: 0
        }
      );
      res.status(200).json({
        success: true,
        reportName: "Daily Income and Expenses",
        source: "Shop Operations & ERPNext Vouchers",
        fromDate,
        toDate,
        totals,
        data: rows
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  ReportsController,
};
