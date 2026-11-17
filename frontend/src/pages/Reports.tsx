import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAccounting } from '../context/AccountingContext';
import {
  FileBarChart,
  RefreshCw,
  Calendar,
  Building2,
  TrendingUp,
  Scale,
  BookOpen,
  DollarSign,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
} from 'lucide-react';

type ReportTab =
  | 'monthly-pnl'
  | 'daily-sales-pnl'
  | 'daily-income-expenses'
  | 'balance-sheet'
  | 'trial-balance'
  | 'general-ledger'
  | 'accounts-receivable'
  | 'accounts-payable';

interface ColumnDef {
  label: string;
  fieldname: string;
  fieldtype: string;
  width?: number;
}

interface DailySalesPnLRow {
  date: string;
  ordersCount: number;
  salesRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  netProfitLoss: number;
}

interface DailyIncomeExpenseRow {
  date: string;
  cashSales: number;
  bankSales: number;
  creditSales: number;
  totalSales: number;
  purchasesPaid: number;
  operatingExpenses: number;
  netCashFlow: number;
}

export const Reports: React.FC = () => {
  const { isErpAccounting, pluginInfo } = useAccounting();
  const [activeTab, setActiveTab] = useState<ReportTab>('monthly-pnl');
  const [columns, setColumns] = useState<ColumnDef[]>([]);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [customTotals, setCustomTotals] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const firstDay = `${new Date().getFullYear()}-01-01`;
  const [fromDate, setFromDate] = useState<string>(firstDay);
  const [toDate, setToDate] = useState<string>(today);

  const fetchReport = async (tab: ReportTab) => {
    setLoading(true);
    setError(null);
    setCustomTotals(null);
    try {
      if (tab === 'monthly-pnl') {
        const res = await api.get(`/reports/profit-and-loss?periodicity=Monthly&from_date=${fromDate}&to_date=${toDate}`);
        if (res.data.success && res.data.data) {
          setColumns(res.data.data.columns || []);
          setRows(res.data.data.result || []);
        }
      } else if (tab === 'daily-sales-pnl') {
        const res = await api.get(`/reports/daily-sales-pnl?from_date=${fromDate}&to_date=${toDate}`);
        if (res.data.success) {
          setRows(res.data.data || []);
          setCustomTotals(res.data.totals || null);
        }
      } else if (tab === 'daily-income-expenses') {
        const res = await api.get(`/reports/daily-income-expenses?from_date=${fromDate}&to_date=${toDate}`);
        if (res.data.success) {
          setRows(res.data.data || []);
          setCustomTotals(res.data.totals || null);
        }
      } else {
        const res = await api.get(`/reports/${tab}?from_date=${fromDate}&to_date=${toDate}`);
        if (res.data.success && res.data.data) {
          setColumns(res.data.data.columns || []);
          setRows(res.data.data.result || []);
        }
      }
    } catch {
      setError('Could not fetch report from ERPNext Accounting.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'monthly-pnl', label: '1. Monthly Profit & Loss', icon: TrendingUp },
    { id: 'daily-sales-pnl', label: '2. Daily Sales & P&L (COGS)', icon: PieChart },
    { id: 'daily-income-expenses', label: '3. Daily Income & Expenses', icon: DollarSign },
    { id: 'balance-sheet', label: '4. Daily Balance Sheet', icon: BookOpen },
    { id: 'trial-balance', label: '5. Trial Balance', icon: Scale },
    { id: 'general-ledger', label: '6. General Ledger', icon: FileBarChart },
    { id: 'accounts-receivable', label: '7. Customer Receivables', icon: Users },
    { id: 'accounts-payable', label: '8. Supplier Payables', icon: Building2 },
  ];

  const formatCurrency = (val: number | undefined | null) => {
    if (val === undefined || val === null) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCellValue = (val: unknown) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      return val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(val);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-7 h-7 text-sky-600" />
            Financial & Accounting Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Centralized Accounting Engine:
            {isErpAccounting ? (
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded text-xs border border-emerald-200">
                ERPNext Accounting Single Source of Truth (Company: cubet)
              </span>
            ) : (
              <span className="font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded text-xs border border-sky-200">
                Manager Accounting Module (EAccounting Single Source of Truth)
              </span>
            )}
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-slate-700 focus:outline-none"
            />
          </div>
          <button
            onClick={() => fetchReport(activeTab)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {!isErpAccounting && (
        <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
            <span>
              <strong>Manager Accounting Mode Active (ERP_Accounting=false).</strong> ERPNext Reports are hidden from sidebar navigation. The reports below are fetched via Manager's EAccounting API engine.
            </span>
          </div>
          <span className="font-mono text-[11px] text-sky-700 bg-sky-100/60 px-2 py-0.5 rounded">
            API: http://localhost:5001
          </span>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-sky-600 text-sky-600 bg-sky-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Summary KPI Cards for Tab 2 (Daily Sales & PnL) */}
      {activeTab === 'daily-sales-pnl' && customTotals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Sales Revenue</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(customTotals.salesRevenue)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{customTotals.ordersCount} POS orders completed</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Cost of Goods Sold (COGS)</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(customTotals.cogs)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Fabric procurement inventory cost</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Gross Profit (Margin)</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(customTotals.grossProfit)}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">
              {customTotals.grossMarginPercent}% Gross Margin
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net Profit / Loss</div>
            <div
              className={`text-xl font-bold mt-1 ${
                customTotals.netProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(customTotals.netProfitLoss)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">After ₹{customTotals.operatingExpenses} expenses</div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards for Tab 3 (Daily Income & Expenses) */}
      {activeTab === 'daily-income-expenses' && customTotals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Sales Inflows</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(customTotals.totalSales)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Cash: ₹{customTotals.cashSales.toFixed(0)} • Bank: ₹{customTotals.bankSales.toFixed(0)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Stock Restocking Purchases</div>
            <div className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(customTotals.purchasesPaid)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Restocked fabric batches</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Operational Expenses</div>
            <div className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(customTotals.operatingExpenses)}</div>
            <div className="text-xs text-slate-400 mt-0.5">Rent, Utilities, Salaries & Ads</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Net Cash Flow</div>
            <div
              className={`text-xl font-bold mt-1 ${
                customTotals.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(customTotals.netCashFlow)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Inflows vs Outflows</div>
          </div>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Main Table View */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {/* TAB 2: Custom Daily Sales & P&L Table */}
          {activeTab === 'daily-sales-pnl' ? (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 sticky top-0 z-10 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-center">Orders</th>
                  <th className="px-5 py-3.5 text-right">Sales Revenue</th>
                  <th className="px-5 py-3.5 text-right">COGS (Cost)</th>
                  <th className="px-5 py-3.5 text-right">Gross Profit</th>
                  <th className="px-5 py-3.5 text-center">Gross Margin %</th>
                  <th className="px-5 py-3.5 text-right">Op. Expenses</th>
                  <th className="px-5 py-3.5 text-right">Net Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {(rows as unknown as DailySalesPnLRow[]).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 font-sans">{r.date}</td>
                    <td className="px-5 py-3 text-center">{r.ordersCount}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(r.salesRevenue)}</td>
                    <td className="px-5 py-3 text-right text-amber-700">{formatCurrency(r.cogs)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">{formatCurrency(r.grossProfit)}</td>
                    <td className="px-5 py-3 text-center font-semibold text-emerald-700">{r.grossMarginPercent}%</td>
                    <td className="px-5 py-3 text-right text-rose-600">{formatCurrency(r.operatingExpenses)}</td>
                    <td
                      className={`px-5 py-3 text-right font-bold ${
                        r.netProfitLoss >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(r.netProfitLoss)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'daily-income-expenses' ? (
            /* TAB 3: Custom Daily Income & Expenses Table */
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 sticky top-0 z-10 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Cash Receipts</th>
                  <th className="px-5 py-3.5 text-right">Bank / UPI Receipts</th>
                  <th className="px-5 py-3.5 text-right">Credit / Unpaid</th>
                  <th className="px-5 py-3.5 text-right">Total Sales</th>
                  <th className="px-5 py-3.5 text-right">Purchases Paid</th>
                  <th className="px-5 py-3.5 text-right">Operating Expenses</th>
                  <th className="px-5 py-3.5 text-right">Net Daily Cashflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {(rows as unknown as DailyIncomeExpenseRow[]).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 font-sans">{r.date}</td>
                    <td className="px-5 py-3 text-right text-slate-800">{formatCurrency(r.cashSales)}</td>
                    <td className="px-5 py-3 text-right text-sky-700">{formatCurrency(r.bankSales)}</td>
                    <td className="px-5 py-3 text-right text-amber-600">{formatCurrency(r.creditSales)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">{formatCurrency(r.totalSales)}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(r.purchasesPaid)}</td>
                    <td className="px-5 py-3 text-right text-rose-600">{formatCurrency(r.operatingExpenses)}</td>
                    <td
                      className={`px-5 py-3 text-right font-bold ${
                        r.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(r.netCashFlow)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* ERPNext Standard Reports (Monthly P&L, Balance Sheet, General Ledger, Trial Balance, Receivables, Payables) */
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 sticky top-0 z-10 text-xs uppercase text-slate-500 border-b border-slate-200 font-semibold tracking-wider backdrop-blur-sm">
                <tr>
                  {columns.length > 0 ? (
                    columns.map((col, idx) => (
                      <th key={idx} className="px-5 py-3.5 whitespace-nowrap">
                        {col.label}
                      </th>
                    ))
                  ) : (
                    <>
                      <th className="px-5 py-3.5">Account / Entity</th>
                      <th className="px-5 py-3.5 text-right">Debit</th>
                      <th className="px-5 py-3.5 text-right">Credit</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={columns.length || 3} className="px-6 py-16 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                      Querying ERPNext Accounting Report...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length || 3} className="px-6 py-16 text-center text-slate-400">
                      No data returned for this date range.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIdx) => {
                    const isTotal =
                      (row.account && String(row.account).toLowerCase().includes('total')) ||
                      (row.account_name && String(row.account_name).toLowerCase().includes('total'));
                    return (
                      <tr
                        key={rowIdx}
                        className={`hover:bg-slate-50/60 transition-colors ${
                          isTotal ? 'bg-slate-50 font-bold text-slate-900 border-t border-b border-slate-300' : ''
                        }`}
                      >
                        {columns.length > 0 ? (
                          columns.map((col, cIdx) => {
                            const val = row[col.fieldname];
                            const isNumber = typeof val === 'number';
                            return (
                              <td
                                key={cIdx}
                                className={`px-5 py-3 whitespace-nowrap ${
                                  isNumber ? 'text-right' : 'text-left font-sans'
                                }`}
                              >
                                {formatCellValue(val)}
                              </td>
                            );
                          })
                        ) : (
                          Object.keys(row).map((k, kIdx) => (
                            <td key={kIdx} className="px-5 py-3 whitespace-nowrap">
                              {formatCellValue(row[k])}
                            </td>
                          ))
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
