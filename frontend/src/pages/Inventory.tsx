import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Boxes, Plus, RefreshCw, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownLeft, ShieldAlert } from 'lucide-react';

interface InventoryTx {
  id: number;
  productId: number;
  product?: { name: string; sku: string };
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  referenceType?: string;
  referenceId?: number;
  notes?: string;
  erpnextStockEntryId?: string | null;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
  erpnextItemCode?: string;
}

export const Inventory: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTx[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [productId, setProductId] = useState<number>(1);
  const [transactionType, setTransactionType] = useState<string>('DAMAGE');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('Damaged during fabric handling');

  // Realtime balance check state
  const [selectedCheckProduct, setSelectedCheckProduct] = useState<number>(1);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<{
    localStock: number;
    erpnextStock: number;
    erpnextWarehouse: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, prodRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/products'),
      ]);
      if (txRes.data.success) setTransactions(txRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) {
          setProductId(prodRes.data.data[0].id);
          setSelectedCheckProduct(prodRes.data.data[0].id);
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load inventory movements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await api.post('/inventory', {
        productId,
        transactionType,
        quantity,
        notes,
      });

      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `Stock adjustment (${transactionType} x${quantity}) posted and synced to ERPNext Stock Entry (${res.data.erpnext?.stockEntryId || 'Synced'})!`,
        });
        setShowModal(false);
        fetchData();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to adjust stock';
      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckWarehouseBalance = async () => {
    setCheckingBalance(true);
    setBalanceResult(null);
    try {
      const res = await api.get(`/inventory/stock-balance/${selectedCheckProduct}`);
      if (res.data.success) {
        setBalanceResult(res.data.data);
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to query ERPNext warehouse balance' });
    } finally {
      setCheckingBalance(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'STOCK_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            STOCK_IN
          </span>
        );
      case 'STOCK_OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <ArrowUpRight className="w-3 h-3 text-sky-600" />
            STOCK_OUT
          </span>
        );
      case 'DAMAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            DAMAGE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-sky-600" />
            Inventory Movements & Stock Entries
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock audit trail with automatic ERPNext Material Issue and Receipt sync
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
            Record Stock Adjustment
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

      {/* Real-time ERPNext Warehouse Balance Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md border border-slate-700 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live ERPNext Warehouse Balance Verifier
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Queries real-time Bin record from Frappe REST API to cross-verify local store stock with ERPNext warehouse
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={selectedCheckProduct}
              onChange={(e) => setSelectedCheckProduct(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
            <button
              onClick={handleCheckWarehouseBalance}
              disabled={checkingBalance}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingBalance ? 'animate-spin' : ''}`} />
              Verify Live Stock
            </button>
          </div>
        </div>

        {balanceResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/80">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Local Store Stock</div>
              <div className="text-xl font-bold text-white mt-1">{balanceResult.localStock} units</div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">ERPNext Warehouse Stock</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">{balanceResult.erpnextStock} units</div>
            </div>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Warehouse Target</div>
              <div className="text-sm font-semibold text-sky-300 mt-1 truncate">{balanceResult.erpnextWarehouse}</div>
            </div>
          </div>
        )}
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Movement Audit Trail</h2>
          <span className="text-xs text-slate-500">{transactions.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5 text-center">Quantity</th>
                <th className="px-6 py-3.5">Reason / Reference</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">ERPNext Stock Entry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading inventory movements...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No inventory movements recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{tx.product?.name || `Product #${tx.productId}`}</div>
                      <div className="text-xs font-mono text-slate-400">{tx.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4">{getTypeBadge(tx.transactionType)}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      <span className={tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      <div>{tx.notes || '—'}</div>
                      {tx.referenceType && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {tx.referenceType} #{tx.referenceId}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(tx.createdAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {tx.erpnextStockEntryId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {tx.erpnextStockEntryId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Record Stock Adjustment</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product *
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current Stock: {p.stockQuantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Movement Type *
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="DAMAGE">DAMAGE (Material Issue / Loss)</option>
                    <option value="ADJUSTMENT">ADJUSTMENT (Audit Correction)</option>
                    <option value="STOCK_IN">STOCK_IN (Material Receipt)</option>
                    <option value="STOCK_OUT">STOCK_OUT (Manual Deduction)</option>
                    <option value="RETURN">RETURN (Customer Return)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Notes *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Torn fabric / moisture damage during monsoon"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">ERPNext Sync Rule:</span> For damage or loss adjustments, an ERPNext Stock Entry of purpose <em>Material Issue</em> is auto-created, crediting inventory valuation and debiting expense.
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
                      Adjusting & Syncing...
                    </>
                  ) : (
                    'Record Adjustment'
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

