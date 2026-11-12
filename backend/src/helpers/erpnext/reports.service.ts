/**
 * reports.service.ts
 * Single Source of Truth: Retrieves official financial reports and balances
 * directly from ERPNext via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';
import { erpNextConfig } from '../../config/erpnext.config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface FrappeReportResponse<T = Record<string, unknown>> {
  message: {
    columns: Array<{
      label: string;
      fieldname: string;
      fieldtype: string;
      width?: number;
    }>;
    result: T[];
    chart?: unknown;
    report_summary?: unknown;
  };
}

export interface DateFilterOptions {
  fromDate?: string;
  toDate?: string;
  periodicity?: 'Monthly' | 'Quarterly' | 'Yearly';
}

export interface DashboardFinancialMetrics {
  cashBalance: number;
  bankBalance: number;
  upiBalance: number;
  customerOutstanding: number;
  supplierOutstanding: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfitLoss: number;
  source: 'ERPNext Accounting Module';
  asOf: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpReportsService {
  /**
   * Helper: Run an official Frappe Query Report in ERPNext.
   */
  public static async runReport<T = Record<string, unknown>>(
    reportName: string,
    filters: Record<string, unknown> = {}
  ): Promise<FrappeReportResponse<T>['message']> {
    const today = new Date().toISOString().split('T')[0];
    const defaultFilters: Record<string, unknown> = {
      company: erpNextConfig.company,
      from_date: `${new Date().getFullYear()}-01-01`,
      to_date: today,
      fiscal_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      periodicity: 'Yearly',
      ...filters,
    };

    const response = await erpNextClient.post<FrappeReportResponse<T>>(
      '/api/method/frappe.desk.query_report.run',
      {
        report_name: reportName,
        filters: defaultFilters,
      }
    );

    return response.data.message;
  }

  /**
   * 1. Profit and Loss Statement from ERPNext.
   */
  public static async getProfitAndLoss(options?: DateFilterOptions) {
    const fiscalYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    return this.runReport('Profit and Loss Statement', {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      periodicity: options?.periodicity || 'Yearly',
      year: String(new Date().getFullYear()),
      filter_based_on: 'Fiscal Year',
      from_fiscal_year: fiscalYear,
      to_fiscal_year: fiscalYear,
    });
  }

  /**
   * 2. Balance Sheet from ERPNext.
   */
  public static async getBalanceSheet(options?: DateFilterOptions) {
    const fiscalYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    return this.runReport('Balance Sheet', {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      periodicity: options?.periodicity || 'Yearly',
      year: String(new Date().getFullYear()),
      filter_based_on: 'Fiscal Year',
      from_fiscal_year: fiscalYear,
      to_fiscal_year: fiscalYear,
    });
  }

  /**
   * 3. General Ledger from ERPNext.
   */
  public static async getGeneralLedger(options?: DateFilterOptions & { account?: string; party?: string }) {
    const today = new Date().toISOString().split('T')[0];
    const fromDate = options?.fromDate || `${new Date().getFullYear()}-01-01`;
    const toDate = options?.toDate || today;
    return this.runReport('General Ledger', {
      from_date: fromDate,
      to_date: toDate,
      ...(options?.account && { account: options.account }),
      ...(options?.party && { party: options.party }),
    });
  }

  /**
   * 4. Trial Balance from ERPNext.
   */
  public static async getTrialBalance(options?: DateFilterOptions) {
    return this.runReport('Trial Balance', {
      from_date: options?.fromDate,
      to_date: options?.toDate,
      fiscal_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    });
  }

  /**
   * 5. Accounts Receivable (Customer Outstanding) from ERPNext.
   */
  public static async getAccountsReceivable(options?: { customer?: string; reportDate?: string }) {
    const today = new Date().toISOString().split('T')[0];
    return this.runReport('Accounts Receivable', {
      report_date: options?.reportDate || today,
      ...(options?.customer && { customer: options.customer }),
    });
  }

  /**
   * 6. Accounts Payable (Supplier Outstanding) from ERPNext.
   */
  public static async getAccountsPayable(options?: { supplier?: string; reportDate?: string }) {
    const today = new Date().toISOString().split('T')[0];
    return this.runReport('Accounts Payable', {
      report_date: options?.reportDate || today,
      ...(options?.supplier && { supplier: options.supplier }),
    });
  }

  /**
   * 7. Stock Balance Report from ERPNext.
   */
  public static async getStockBalanceReport(options?: { itemCode?: string; warehouse?: string }) {
    const today = new Date().toISOString().split('T')[0];
    return this.runReport('Stock Balance', {
      from_date: `${new Date().getFullYear()}-01-01`,
      to_date: today,
      ...(options?.itemCode && { item_code: options.itemCode }),
      ...(options?.warehouse && { warehouse: options.warehouse }),
    });
  }

  /**
   * Get net balance for an account directly from ERPNext GL Entries.
   */
  public static async getAccountBalanceFromGL(accountName: string): Promise<number> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<Array<{ debit: number; credit: number }>>>(
        '/api/resource/GL%20Entry',
        {
          params: {
            filters: JSON.stringify([['account', '=', accountName]]),
            fields: JSON.stringify(['debit', 'credit']),
            limit_page_length: 2000,
          },
        }
      );

      const entries = response.data.data || [];
      return entries.reduce((acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)), 0);
    } catch {
      return 0;
    }
  }

  /**
   * Dashboard Financial Summary (All figures from ERPNext).
   */
  public static async getDashboardMetrics(): Promise<DashboardFinancialMetrics> {
    const [cashBal, bankBal, debtorsBal, creditorsBal, salesEntries, expenseEntries] = await Promise.all([
      this.getAccountBalanceFromGL('Cash - C'),
      this.getAccountBalanceFromGL('HDFC Bank - C'),
      this.getAccountBalanceFromGL('Debtors - C'),
      this.getAccountBalanceFromGL('Creditors - C'),
      erpNextClient.get<FrappeDocResponse<Array<{ debit: number; credit: number }>>>('/api/resource/GL%20Entry', {
        params: {
          filters: JSON.stringify([['account', '=', 'Sales - C']]),
          fields: JSON.stringify(['debit', 'credit']),
          limit_page_length: 1000,
        },
      }).catch(() => ({ data: { data: [] } })),
      erpNextClient.get<FrappeDocResponse<Array<{ debit: number; credit: number }>>>('/api/resource/GL%20Entry', {
        params: {
          filters: JSON.stringify([['account', 'like', '%Expense%']]),
          fields: JSON.stringify(['debit', 'credit']),
          limit_page_length: 1000,
        },
      }).catch(() => ({ data: { data: [] } })),
    ]);

    // For Sales (Income), Credit > Debit represents positive revenue
    const salesList = salesEntries.data.data || [];
    const totalRevenue = salesList.reduce((acc, curr) => acc + (Number(curr.credit) - Number(curr.debit)), 0);

    // For Expenses, Debit > Credit represents expense amount
    const expenseList = expenseEntries.data.data || [];
    const totalExpenses = expenseList.reduce((acc, curr) => acc + (Number(curr.debit) - Number(curr.credit)), 0);

    const netProfitLoss = totalRevenue - totalExpenses;

    return {
      cashBalance: Math.max(0, cashBal),
      bankBalance: bankBal,
      upiBalance: bankBal, // UPI routes to bank account
      customerOutstanding: Math.max(0, debtorsBal),
      supplierOutstanding: Math.max(0, -creditorsBal),
      totalRevenue,
      totalExpenses,
      netProfitLoss,
      source: 'ERPNext Accounting Module',
      asOf: new Date().toISOString(),
    };
  }
}

