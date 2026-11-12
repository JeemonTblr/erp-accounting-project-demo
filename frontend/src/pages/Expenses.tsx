import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Receipt, Plus, RefreshCw, CheckCircle, AlertCircle, Clock, BookOpen } from 'lucide-react';

interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  description?: string;
  erpnextJournalEntryId?: string | null;
  erpnextAccountId?: string | null;
}

const CATEGORIES = [
  { value: 'Rent', label: 'Office / Shop Rent (Office Rent - C)' },
  { value: 'Electricity', label: 'Electricity / Utility (Utility Expenses - C)' },
  { value: 'Salary', label: 'Staff Salaries (Salary - C)' },
  { value: 'Maintenance', label: 'Office Maintenance (Office Maintenance Expenses - C)' },
  { value: 'Marketing', label: 'Advertising & Marketing (Marketing Expenses - C)' },
  { value: 'Travel', label: 'Travel & Conveyance (Travel Expenses - C)' },
  { value: 'Miscellaneous', label: 'Miscellaneous Shop Expenses (Miscellaneous Expenses - C)' },
];

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Electricity',
    amount: 1500,
    paymentMethod: 'CASH',
    referenceNumber: '',
    description: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses');
      if (res.data.success) {
        setExpenses(res.data.data);
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load daily expenses' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await api.post('/expenses', formData);
      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `Expense "${formData.title}" recorded! Auto-synced to ERPNext Journal Entry (${res.data.erpnext?.journalEntryId || 'Synced'}).`,
        });
        setShowModal(false);
        setFormData({
          title: '',
          category: 'Electricity',
          amount: 1500,
          paymentMethod: 'CASH',
          referenceNumber: '',
          description: '',
        });
        fetchData();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to record expense';
      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrySync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await api.post(`/expenses/${id}/sync`);
      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `ERPNext Journal Entry synced: ${res.data.data?.erpnextJournalEntryId}`,
        });
        fetchData();
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to sync Journal Entry to ERPNext' });
    } finally {
      setSyncingId(null);
    }
  };

  const totalExpenseSum = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const syncedCount = expenses.filter((e) => e.erpnextJournalEntryId).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-sky-600" />
            Daily Expense Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Store operations expenses synchronized directly to ERPNext General Ledger via automated Journal Entries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2.5 rounded-lg shadow-sm shadow-sky-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Expenses</div>
          <div className="text-2xl font-bold text-rose-600 mt-1.5">
            ₹{totalExpenseSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">{expenses.length} expense vouchers recorded</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">GL Synchronization</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1.5">
            {syncedCount} / {expenses.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Official Journal Entries submitted</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">ERPNext Integration</div>
          <div className="text-sm font-semibold text-sky-700 mt-1.5 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-sky-600" />
            Automated Double Entry Journal
          </div>
          <div className="text-xs text-slate-400 mt-1">Dr: Expense Account • Cr: Cash/Bank</div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Expense Details</th>
                <th className="px-6 py-3.5">Category & Ref</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5 text-right">Amount</th>
                <th className="px-6 py-3.5">ERPNext Journal Entry</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No expense records found. Click "Record Expense" to log daily shop operational costs.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{e.title}</div>
                      {e.description && <div className="text-xs text-slate-400 mt-0.5">{e.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                      {e.referenceNumber && (
                        <div className="text-xs font-mono text-slate-400 mt-1">Ref: {e.referenceNumber}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(e.expenseDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {e.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                      ₹{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      {e.erpnextJournalEntryId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {e.erpnextJournalEntryId}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          Pending Sync
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!e.erpnextJournalEntryId && (
                        <button
                          onClick={() => handleRetrySync(e.id)}
                          disabled={syncingId === e.id}
                          className="text-xs text-sky-600 hover:text-sky-800 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingId === e.id ? 'animate-spin' : ''}`} />
                          Sync JV
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Record Operational Expense</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Showroom Electricity Bill"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Expense Category (ERPNext Account) *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="CASH">Cash (Cash - C)</option>
                    <option value="BANK">Bank Transfer (HDFC Bank - C)</option>
                    <option value="UPI">UPI Payment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Reference / Voucher #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EBILL-1029"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    placeholder="Optional remarks"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Accounting Rule:</span> Submitting this expense automatically generates and posts a Journal Entry to ERPNext, debiting the expense ledger and crediting your selected Cash or Bank account.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Posting Journal Entry...
                    </>
                  ) : (
                    'Post Expense & Sync'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

