import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Truck, Plus, RefreshCw, CheckCircle, ExternalLink, AlertCircle, Clock } from 'lucide-react';

interface PurchaseItem {
  id?: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface Purchase {
  id: number;
  purchaseNumber: string;
  supplier?: { id: number; name: string; phone?: string };
  purchaseDate: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAmount: number;
  erpnextPurchaseInvoiceId?: string | null;
  erpnextPaymentId?: string | null;
  items?: PurchaseItem[];
}

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  gstin?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  purchasePrice: number;
  stockQuantity: number;
}

export const Purchases: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState<number>(1);
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK');
  const [paymentStatus, setPaymentStatus] = useState<string>('PAID');
  const [notes, setNotes] = useState<string>('Stock batch replenishment');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      if (purRes.data.success) setPurchases(purRes.data.data);
      if (supRes.data.success) {
        setSuppliers(supRes.data.data);
        if (supRes.data.data.length > 0) setSupplierId(supRes.data.data[0].id);
      }
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) {
          setProductId(prodRes.data.data[0].id);
          setCustomPrice(prodRes.data.data[0].purchasePrice || 500);
        }
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load purchase records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProductSelect = (id: number) => {
    setProductId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCustomPrice(prod.purchasePrice);
    }
  };

  const lineTotal = customPrice * quantity;
  const tax = lineTotal * 0.05;
  const grandTotal = lineTotal + tax;

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const payload = {
        supplierId,
        paymentStatus,
        paymentMethod,
        paidAmount: paymentStatus === 'PAID' ? grandTotal : 0,
        notes,
        items: [
          {
            productId,
            quantity,
            unitPrice: customPrice,
          },
        ],
      };

      const res = await api.post('/purchases', payload);
      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `Purchase ${res.data.data.purchaseNumber} created & auto-synced to ERPNext (${res.data.erpnext?.purchaseInvoiceId || 'Pending'})! Stock incremented.`,
        });
        setShowModal(false);
        fetchData();
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'Failed to record purchase';
      setMsg({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetrySync = async (id: number) => {
    setSyncingId(id);
    try {
      const res = await api.post(`/purchases/${id}/sync`);
      if (res.data.success) {
        setMsg({ type: 'success', text: `ERPNext sync completed: ${res.data.data?.erpnextPurchaseInvoiceId || 'Synced'}` });
        fetchData();
      }
    } catch {
      setMsg({ type: 'error', text: 'ERPNext sync retry failed.' });
    } finally {
      setSyncingId(null);
    }
  };

  const totalSpent = purchases.reduce((acc, p) => acc + Number(p.grandTotal || 0), 0);
  const paidCount = purchases.filter((p) => p.paymentStatus === 'PAID').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-7 h-7 text-sky-600" />
            Stock Purchases & Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supplier procurement management with automatic ERPNext Purchase Invoice & Payment Entry sync
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
            New Purchase Order
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Purchases</div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5">{purchases.length} Orders</div>
          <div className="text-xs text-slate-400 mt-1">{paidCount} Paid in Full</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Value</div>
          <div className="text-2xl font-bold text-sky-600 mt-1.5">
            ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Includes GST</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Accounting Engine</div>
          <div className="text-sm font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ERPNext Purchase Invoice & Payment
          </div>
          <div className="text-xs text-slate-400 mt-1">Updates Accounts Payable & Stock Balance</div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-800">Purchase History</h2>
          <span className="text-xs text-slate-500">{purchases.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">PO Number</th>
                <th className="px-6 py-3.5">Supplier</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Items / Total</th>
                <th className="px-6 py-3.5">Payment</th>
                <th className="px-6 py-3.5">ERPNext Invoice</th>
                <th className="px-6 py-3.5">ERPNext Payment</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    No purchase orders recorded yet. Click "New Purchase Order" to restock inventory.
                  </td>
                </tr>
              ) : (
                purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 font-mono text-xs">{p.purchaseNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{p.supplier?.name || 'Standard Supplier'}</div>
                      {p.supplier?.phone && <div className="text-xs text-slate-400">{p.supplier.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        ₹{Number(p.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.items?.length || 1} item(s) • Tax: ₹{Number(p.taxAmount || 0).toFixed(0)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          p.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4">
                      {p.erpnextPurchaseInvoiceId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {p.erpnextPurchaseInvoiceId}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {p.erpnextPaymentId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          <CheckCircle className="w-3 h-3 text-sky-600" />
                          {p.erpnextPaymentId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!p.erpnextPurchaseInvoiceId && (
                        <button
                          onClick={() => handleRetrySync(p.id)}
                          disabled={syncingId === p.id}
                          className="text-xs text-sky-600 hover:text-sky-800 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingId === p.id ? 'animate-spin' : ''}`} />
                          Retry Sync
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

      {/* New Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <h3 className="text-lg font-bold text-slate-900">Record Stock Purchase</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.gstin ? `(GST: ${s.gstin})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Product / Fabric
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => handleProductSelect(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Stock: {p.stockQuantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Purchase Price (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="BANK">Bank Transfer (HDFC Bank - C)</option>
                    <option value="CASH">Cash (Cash - C)</option>
                    <option value="UPI">UPI Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="PAID">PAID (Full Payment Entry)</option>
                    <option value="UNPAID">UNPAID (Payable Outstanding)</option>
                  </select>
                </div>
              </div>

              {/* Order Summary box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{lineTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%):</span>
                  <span className="font-mono">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                  <span>Grand Total Payable:</span>
                  <span className="font-mono text-sky-600">₹{grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-emerald-700 pt-1 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Auto-generates ERPNext Purchase Invoice + stock increment on submission
                </p>
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
                      Syncing to ERPNext...
                    </>
                  ) : (
                    'Record & Sync Purchase'
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

