import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eaccountingApi } from './api';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Receipt,
  TrendingDown,
  ShoppingBag,
  TrendingUp,
  BookOpen,
  Wallet,
  FileBarChart,
  Clock,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-react';

export type EAccTab =
  | 'dashboard'
  | 'foundation'
  | 'invoices'
  | 'receipts'
  | 'expenses'
  | 'purchases'
  | 'pnl'
  | 'balance'
  | 'cashbank'
  | 'reports'
  | 'outstanding';

const tabsList: Array<{ id: EAccTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'foundation', label: 'Foundation', icon: Settings },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
  { id: 'pnl', label: 'P&L', icon: TrendingUp },
  { id: 'balance', label: 'Balance Sheet', icon: BookOpen },
  { id: 'cashbank', label: 'Cash & Bank', icon: Wallet },
  { id: 'reports', label: 'Reports', icon: FileBarChart },
  { id: 'outstanding', label: 'Outstanding', icon: Clock },
];

export const EAccountingView: React.FC = () => {
  const { module } = useParams<{ module?: string }>();
  const activeTab: EAccTab = (module as EAccTab) || 'dashboard';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Module state containers
  const [incomeSummary, setIncomeSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [foundationData, setFoundationData] = useState<{ config: any; accounts: any[]; roles: any[]; trail: any[] }>({
    config: null,
    accounts: [],
    roles: [],
    trail: [],
  });
  const [expensesData, setExpensesData] = useState<{ summary: any; entries: any[]; categories: any[] }>({
    summary: null,
    entries: [],
    categories: [],
  });
  const [purchasesData, setPurchasesData] = useState<{ summary: any; suppliers: any[]; bills: any[] }>({
    summary: null,
    suppliers: [],
    bills: [],
  });
  const [pnlData, setPnlData] = useState<{ summary: any; comparison: any[]; accounts: any[] }>({
    summary: null,
    comparison: [],
    accounts: [],
  });
  const [balanceData, setBalanceData] = useState<{ summary: any; comparison: any[]; accounts: any[] }>({
    summary: null,
    comparison: [],
    accounts: [],
  });
  const [cashBankData, setCashBankData] = useState<{ summary: any; accounts: any[]; cashBook: any[] }>({
    summary: null,
    accounts: [],
    cashBook: [],
  });
  const [reportsData, setReportsData] = useState<{
    dayBook: any[];
    periods: any[];
    trialBalance: any[];
    cashFlow: any;
    tax: any;
    charts: any[];
  }>({
    dayBook: [],
    periods: [],
    trialBalance: [],
    cashFlow: null,
    tax: null,
    charts: [],
  });
  const [outstandingData, setOutstandingData] = useState<{
    summary: any;
    customers: any[];
    suppliers: any[];
    aging: any[];
    statements: any[];
  }>({
    summary: null,
    customers: [],
    suppliers: [],
    aging: [],
    statements: [],
  });

  const loadModuleData = async (tab: EAccTab) => {
    setLoading(true);
    setError(null);
    try {
      switch (tab) {
        case 'dashboard': {
          const sum = await eaccountingApi.dailyIncome.getSummary();
          setIncomeSummary(sum);
          break;
        }
        case 'foundation': {
          const [cfg, accs, roleList, trail] = await Promise.all([
            eaccountingApi.foundation.getConfig(),
            eaccountingApi.foundation.getChartOfAccounts(),
            eaccountingApi.foundation.getRoles(),
            eaccountingApi.foundation.getAuditTrail(),
          ]);
          setFoundationData({ config: cfg, accounts: accs, roles: roleList, trail });
          break;
        }
        case 'invoices': {
          const invs = await eaccountingApi.dailyIncome.getInvoices();
          setInvoices(invs);
          break;
        }
        case 'receipts': {
          const recs = await eaccountingApi.dailyIncome.getReceipts();
          setReceipts(recs);
          break;
        }
        case 'expenses': {
          const [sum, entries, cats] = await Promise.all([
            eaccountingApi.expenses.getSummary(),
            eaccountingApi.expenses.getEntries(),
            eaccountingApi.expenses.getCategories(),
          ]);
          setExpensesData({ summary: sum, entries, categories: cats });
          break;
        }
        case 'purchases': {
          const [sum, sups, bills] = await Promise.all([
            eaccountingApi.purchases.getSummary(),
            eaccountingApi.purchases.getSuppliers(),
            eaccountingApi.purchases.getBills(),
          ]);
          setPurchasesData({ summary: sum, suppliers: sups, bills });
          break;
        }
        case 'pnl': {
          const [sum, comp, accs] = await Promise.all([
            eaccountingApi.pnl.getSummary(),
            eaccountingApi.pnl.getComparison(),
            eaccountingApi.pnl.getAccounts(),
          ]);
          setPnlData({ summary: sum, comparison: comp, accounts: accs });
          break;
        }
        case 'balance': {
          const [sum, comp, accs] = await Promise.all([
            eaccountingApi.balance.getSummary(),
            eaccountingApi.balance.getComparison(),
            eaccountingApi.balance.getAccounts(),
          ]);
          setBalanceData({ summary: sum, comparison: comp, accounts: accs });
          break;
        }
        case 'cashbank': {
          const [sum, accs, book] = await Promise.all([
            eaccountingApi.cashbank.getSummary(),
            eaccountingApi.cashbank.getAccounts(),
            eaccountingApi.cashbank.getCashBook(),
          ]);
          setCashBankData({ summary: sum, accounts: accs, cashBook: book });
          break;
        }
        case 'reports': {
          const [dbk, per, tb, cf, tx, ch] = await Promise.all([
            eaccountingApi.reports.getDayBook(),
            eaccountingApi.reports.getPeriods(),
            eaccountingApi.reports.getTrialBalance(),
            eaccountingApi.reports.getCashFlow(),
            eaccountingApi.reports.getTax(),
            eaccountingApi.reports.getCharts(),
          ]);
          setReportsData({ dayBook: dbk, periods: per, trialBalance: tb, cashFlow: cf, tax: tx, charts: ch });
          break;
        }
        case 'outstanding': {
          const [sum, custs, sups, aging, stmts] = await Promise.all([
            eaccountingApi.outstanding.getSummary(),
            eaccountingApi.outstanding.getCustomers(),
            eaccountingApi.outstanding.getSuppliers(),
            eaccountingApi.outstanding.getAging(),
            eaccountingApi.outstanding.getStatements(),
          ]);
          setOutstandingData({ summary: sum, customers: custs, suppliers: sups, aging, statements: stmts });
          break;
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load module data from EAccounting server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData(activeTab);
  }, [activeTab]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-sky-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
              EA
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EAccounting Plugin Suite</h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                <span>Active Engine: <strong>Manager REST API</strong></span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-600 font-mono text-[11px]">http://localhost:5001</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => loadModuleData(activeTab)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          <span>Refresh Module</span>
        </button>
      </div>

      {/* Module Horizontal Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-100">
        {tabsList.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              to={`/eaccounting/${t.id}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
          <span>Loading {activeTab.toUpperCase()} data from manager API...</span>
        </div>
      )}

      {/* ────────────────── MODULE VIEWS ────────────────── */}
      {!loading && (
        <div className="space-y-6">
          {/* 1. DASHBOARD */}
          {activeTab === 'dashboard' && incomeSummary && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Accounting Dashboard</h2>
                <p className="text-xs text-slate-500 mt-1">Daily revenue, receivables, payment mix, and collection health.</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Revenue today</span>
                    <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                      ₹{incomeSummary.revenueToday.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Receipts today</span>
                    <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                      ₹{incomeSummary.receiptsToday.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Outstanding</span>
                    <strong className="text-2xl font-bold text-amber-600 mt-1 block">
                      ₹{incomeSummary.outstanding.toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 block">Avg. collection days</span>
                    <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                      {incomeSummary.averageCollectionDays} days
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Payment Mix</h3>
                    <ul className="space-y-2 text-xs">
                      {incomeSummary.paymentModeBreakdown?.map((item: any) => (
                        <li key={item.mode} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600 font-medium">{item.mode}</span>
                          <strong className="text-slate-900 font-mono">₹{item.amount.toLocaleString('en-IN')}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Total Tax Collected</h3>
                      <p className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
                        ₹{incomeSummary.totalTax.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">Includes CGST & SGST standard slabs</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. FOUNDATION */}
          {activeTab === 'foundation' && foundationData.config && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Foundation & Plug-in Configuration</h2>
                  <p className="text-xs text-slate-500 mt-1">Tenant identity, chart of accounts, permission roles, and audit trail.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-3">Tenant Configuration</h3>
                    <p><strong className="text-slate-500">Company:</strong> {foundationData.config.companyName}</p>
                    <p><strong className="text-slate-500">Tenant ID:</strong> {foundationData.config.tenantId}</p>
                    <p><strong className="text-slate-500">Currency:</strong> {foundationData.config.baseCurrency}</p>
                    <p><strong className="text-slate-500">Fiscal Year:</strong> {foundationData.config.fiscalYear}</p>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-3">Feature Flags</h3>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto">
                      {Object.entries(foundationData.config.featureFlags || {}).map(([key, val]) => (
                        <li key={key} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-600">{key}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${val ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                            {val ? 'Enabled' : 'Disabled'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Chart of Accounts */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Chart of Accounts</h3>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Account Code</th>
                          <th className="py-2.5 px-3">Account Name</th>
                          <th className="py-2.5 px-3">Classification Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foundationData.accounts.map((acc: any) => (
                          <tr key={acc.code} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{acc.code}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{acc.name}</td>
                            <td className="py-2.5 px-3 text-slate-600">{acc.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Trail */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Audit Trail</h3>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">ID</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">User</th>
                          <th className="py-2.5 px-3">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {foundationData.trail.map((t: any) => (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-500">{t.id}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">{t.action}</td>
                            <td className="py-2.5 px-3 text-slate-600">{t.user}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{t.timestamp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. INVOICES */}
          {activeTab === 'invoices' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
                <p className="text-xs text-slate-500 mt-1">EAccounting sales invoices with payment tracking.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-right">Paid</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{inv.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{inv.customer}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ₹{inv.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                          ₹{inv.paid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. RECEIPTS */}
          {activeTab === 'receipts' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Receipts</h2>
                <p className="text-xs text-slate-500 mt-1">Incoming payments, payment modes, and bank references.</p>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Receipt Number</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receipts.map((rec: any) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{rec.id}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{rec.customer}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          ₹{rec.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">{rec.mode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{rec.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. EXPENSES */}
          {activeTab === 'expenses' && expensesData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daily Expenses</h2>
                <p className="text-xs text-slate-500 mt-1">Expense vouchers, approval pipeline, and category mapping.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total today</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{expensesData.summary.totalToday.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Approved</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{expensesData.summary.approved.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Pending</span>
                  <strong className="text-2xl font-bold text-amber-600 mt-1 block">
                    ₹{expensesData.summary.pending.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Top category</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    {expensesData.summary.topCategory}
                  </strong>
                </div>
              </div>

              {/* Expense entries table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Expense Entries</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Vendor</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expensesData.entries.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{e.id}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{e.date}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{e.category}</td>
                          <td className="py-2.5 px-3 text-slate-600">{e.vendor}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{e.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              e.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. PURCHASES */}
          {activeTab === 'purchases' && purchasesData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Purchase Management</h2>
                <p className="text-xs text-slate-500 mt-1">Vendor bills, supplier terms, and payment obligations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total bills</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{purchasesData.summary.totalBills.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Paid this month</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{purchasesData.summary.paidThisMonth.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Outstanding</span>
                  <strong className="text-2xl font-bold text-amber-600 mt-1 block">
                    ₹{purchasesData.summary.outstanding.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Top supplier</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    {purchasesData.summary.topSupplier}
                  </strong>
                </div>
              </div>

              {/* Bills table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Purchase Bills</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Bill ID</th>
                        <th className="py-2.5 px-3">Supplier</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchasesData.bills.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{b.id}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{b.supplier}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{b.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600">
                            ₹{b.paid.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{b.dueDate}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. P&L */}
          {activeTab === 'pnl' && pnlData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Monthly Profit & Loss</h2>
                <p className="text-xs text-slate-500 mt-1">Income, gross profit, expenses, and net profit calculations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Income</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{pnlData.summary.income.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Expenses</span>
                  <strong className="text-2xl font-bold text-rose-600 mt-1 block">
                    ₹{pnlData.summary.expenses.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Gross Profit</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{pnlData.summary.grossProfit.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Net Profit</span>
                  <strong className="text-2xl font-bold text-emerald-700 mt-1 block">
                    ₹{pnlData.summary.netProfit.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Month on month comparison */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Month-on-Month Comparison</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3 text-right">Income</th>
                        <th className="py-2.5 px-3 text-right">Expenses</th>
                        <th className="py-2.5 px-3 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pnlData.comparison.map((row: any) => (
                        <tr key={row.month} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{row.month}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600">₹{row.income.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600">₹{row.expenses.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{row.profit.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. BALANCE SHEET */}
          {activeTab === 'balance' && balanceData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daily Balance Sheet</h2>
                <p className="text-xs text-slate-500 mt-1">Assets, liabilities, equity, and working capital position.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Assets</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{balanceData.summary.assets.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Liabilities</span>
                  <strong className="text-2xl font-bold text-rose-600 mt-1 block">
                    ₹{balanceData.summary.liabilities.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Equity</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{balanceData.summary.equity.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Cash & Bank</span>
                  <strong className="text-2xl font-bold text-sky-600 mt-1 block">
                    ₹{(balanceData.summary.cash + balanceData.summary.bank).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Position comparison */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Balance Position Comparison</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-right">Current</th>
                        <th className="py-2.5 px-3 text-right">Previous</th>
                        <th className="py-2.5 px-3 text-right">Net Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {balanceData.comparison.map((r: any) => (
                        <tr key={r.label} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{r.label}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">₹{r.current.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{r.previous.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">₹{r.change.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 9. CASH & BANK */}
          {activeTab === 'cashbank' && cashBankData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Cash & Bank Management</h2>
                <p className="text-xs text-slate-500 mt-1">Multi-account balances, inflows, outflows, and cash book register.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Balance</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{cashBankData.summary.totalBalance.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Cash Counter</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{cashBankData.summary.cashBalance.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Bank Primary</span>
                  <strong className="text-2xl font-bold text-sky-600 mt-1 block">
                    ₹{cashBankData.summary.bankBalance.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">UPI Sales</span>
                  <strong className="text-2xl font-bold text-indigo-600 mt-1 block">
                    ₹{cashBankData.summary.upiBalance.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Cash Book entries */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Cash Book Register</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Entry ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Inflow</th>
                        <th className="py-2.5 px-3 text-right">Outflow</th>
                        <th className="py-2.5 px-3 text-right">Closing Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cashBankData.cashBook.map((row: any) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{row.id}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{row.date}</td>
                          <td className="py-2.5 px-3 text-slate-700">{row.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                            {row.inflow > 0 ? `₹${row.inflow.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-semibold">
                            {row.outflow > 0 ? `₹${row.outflow.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{row.closing.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 10. REPORTS */}
          {activeTab === 'reports' && reportsData.cashFlow && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Financial Reports & Day-Book</h2>
                  <p className="text-xs text-slate-500 mt-1">Cash flow statements, tax summary, trial balance, and daily day-book.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Operating Cash</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{reportsData.cashFlow.operating.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Investing Cash</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{reportsData.cashFlow.investing.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Financing Cash</span>
                  <strong className="text-2xl font-bold text-slate-900 mt-1 block">
                    ₹{reportsData.cashFlow.financing.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Net Cash Flow</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    ₹{reportsData.cashFlow.netCash.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Day Book */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Day Book Journal Entries</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Entry ID</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Voucher</th>
                        <th className="py-2.5 px-3">Account</th>
                        <th className="py-2.5 px-3 text-right">Debit</th>
                        <th className="py-2.5 px-3 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportsData.dayBook.map((db: any) => (
                        <tr key={db.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{db.id}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{db.date}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{db.voucher}</td>
                          <td className="py-2.5 px-3 text-slate-700">{db.account}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                            {db.debit > 0 ? `₹${db.debit.toLocaleString('en-IN')}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-semibold">
                            {db.credit > 0 ? `₹${db.credit.toLocaleString('en-IN')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 11. OUTSTANDING */}
          {activeTab === 'outstanding' && outstandingData.summary && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Outstanding Payments</h2>
                <p className="text-xs text-slate-500 mt-1">Customer receivables, supplier payables, aging buckets, and collection risk.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Receivables</span>
                  <strong className="text-2xl font-bold text-amber-600 mt-1 block">
                    ₹{outstandingData.summary.totalReceivables.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Total Payables</span>
                  <strong className="text-2xl font-bold text-purple-600 mt-1 block">
                    ₹{outstandingData.summary.totalPayables.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Overdue Receivables</span>
                  <strong className="text-2xl font-bold text-rose-600 mt-1 block">
                    ₹{outstandingData.summary.overdueReceivables.toLocaleString('en-IN')}
                  </strong>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 block">Collection Risk</span>
                  <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
                    {outstandingData.summary.collectionRisk}
                  </strong>
                </div>
              </div>

              {/* Customer Outstanding */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Customer Outstanding Details</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3 text-right">Outstanding Amount</th>
                        <th className="py-2.5 px-3 text-right">Overdue</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outstandingData.customers.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{c.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{c.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-rose-600">
                            ₹{c.overdue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ageing Buckets */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Ageing Buckets</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Bucket Window</th>
                        <th className="py-2.5 px-3 text-right">Receivables</th>
                        <th className="py-2.5 px-3 text-right">Payables</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outstandingData.aging.map((ag: any) => (
                        <tr key={ag.bucket} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{ag.bucket}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-bold">
                            ₹{ag.receivables.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-600 font-bold">
                            ₹{ag.payables.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

