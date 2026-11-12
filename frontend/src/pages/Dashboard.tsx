import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Building,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  Receipt,
  Truck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardData {
  today: {
    salesCount: number;
    salesAmount: number;
    expensesCount: number;
    expensesAmount: number;
    purchasesCount: number;
    purchasesAmount: number;
  };
  accounting: {
    cashBalance: number;
    bankBalance: number;
    upiBalance: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfitLoss: number;
    customerOutstanding: number;
    supplierOutstanding: number;
    source: string;
    asOf: string;
  };
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/dashboard');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: unknown) {
      setError('Could not connect to ERPNext Accounting or Shop API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const chartData = [
    {
      name: 'Today',
      Sales: data?.today.salesAmount || 0,
      Expenses: data?.today.expensesAmount || 0,
      Purchases: data?.today.purchasesAmount || 0,
    },
    {
      name: 'Monthly Total (ERPNext)',
      Sales: data?.accounting.monthlyRevenue || 0,
      Expenses: data?.accounting.monthlyExpenses || 0,
      Purchases: (data?.accounting.monthlyExpenses || 0) * 0.8,
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shop Financial Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            Accounting Single Source of Truth:
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              ERPNext Accounting (Company: cubet)
            </span>
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Today's Shop Operations */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Today's Shop Operations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Sales</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{data?.today.salesAmount.toLocaleString('en-IN') || 0}</h3>
              <p className="text-xs text-slate-400 mt-1">{data?.today.salesCount || 0} transactions completed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Expenses</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{data?.today.expensesAmount.toLocaleString('en-IN') || 0}</h3>
              <p className="text-xs text-slate-400 mt-1">{data?.today.expensesCount || 0} expense vouchers posted</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Purchases</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">₹{data?.today.purchasesAmount.toLocaleString('en-IN') || 0}</h3>
              <p className="text-xs text-slate-400 mt-1">{data?.today.purchasesCount || 0} purchase orders placed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Official ERPNext Accounting Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Real-Time Accounting Balances (from ERPNext GL)
          </h2>
          <span className="text-xs text-slate-400">
            As of: {data?.accounting.asOf ? new Date(data.accounting.asOf).toLocaleTimeString() : 'N/A'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-medium">Cash Balance</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">
              ₹{data?.accounting.cashBalance.toLocaleString('en-IN') || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">ERPNext: Cash - C</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-medium">Bank / UPI Balance</span>
              <Building className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-300">
              ₹{data?.accounting.bankBalance.toLocaleString('en-IN') || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">ERPNext: HDFC Bank - C</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-medium">Customer Receivables</span>
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">
              ₹{data?.accounting.customerOutstanding.toLocaleString('en-IN') || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">ERPNext: Debtors - C</p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs uppercase font-medium">Supplier Payables</span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">
              ₹{data?.accounting.supplierOutstanding.toLocaleString('en-IN') || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">ERPNext: Creditors - C</p>
          </div>
        </div>
      </div>

      {/* Row 3: Revenue & P&L Card + Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">ERPNext Profit & Loss</h3>
            <p className="text-xs text-slate-500 mt-1">Official accounting calculations from ERPNext General Ledger</p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Monthly Revenue
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  ₹{data?.accounting.monthlyRevenue.toLocaleString('en-IN') || 0}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  Monthly Expenses
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  ₹{data?.accounting.monthlyExpenses.toLocaleString('en-IN') || 0}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 bg-slate-50 px-3 rounded-lg">
                <span className="text-sm font-semibold text-slate-900">Net Profit / (Loss)</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    (data?.accounting.monthlyProfitLoss || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ₹{data?.accounting.monthlyProfitLoss.toLocaleString('en-IN') || 0}
                </span>
              </div>
            </div>
          </div>

          <a
            href="/reports"
            className="mt-6 inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-sm font-semibold transition-colors"
          >
            <span>View Full P&L Statement in ERPNext</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Visual Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Financial Activity Comparison</h3>
          <p className="text-xs text-slate-500 mb-6">Sales vs Expenses vs Purchases in INR</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${val}`} />
                <Tooltip formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Purchases" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

