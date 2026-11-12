import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { ShoppingCart, Plus, RefreshCw, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';

interface Sale {
  id: number;
  invoiceNumber: string;
  customer?: { name: string; phone?: string };
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAmount: number;
  erpnextInvoiceId?: string | null;
  erpnextPaymentId?: string | null;
  items?: Array<{ itemName: string; quantity: number; unitPrice: number; totalAmount: number }>;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  sellingPrice: number;
  stockQuantity: number;
}

interface Customer {
  id: number;
  name: string;
}

export const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState<number>(1);
  const [productId, setProductId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, prodRes, custRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products'),
        api.get('/customers'),
      ]);
      if (salesRes.data.success) setSales(salesRes.data.data);
      if (prodRes.data.success) {
        setProducts(prodRes.data.data);
        if (prodRes.data.data.length > 0) setProductId(prodRes.data.data[0].id);
      }
      if (custRes.data.success) {
        setCustomers(custRes.data.data);
        if (custRes.data.data.length > 0) setCustomerId(custRes.data.data[0].id);
      }
    } catch {
      setMsg({ type: 'error', text: 'Failed to load sales data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const unitPrice = selectedProduct?.sellingPrice || 0;
  const lineTotal = unitPrice * quantity;
  const tax = lineTotal * 0.05;
  const grandTotal = lineTotal + tax;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg(null);

    try {
      const res = await api.post('/sales', {
        customerId,
        paymentMethod,
        paymentStatus: 'PAID',
        paidAmount: grandTotal,
        items: [
          {
            productId,
            quantity,
            unitPrice,
          },
        ],
      });

      if (res.data.success) {
        setMsg({
          type: 'success',
          text: `Sale recorded! ERPNext Sales Invoice: ${res.data.erpSync?.invoice?.erpnextInvoiceId || 'Synced'} | Payment Entry: ${res.data.erpSync?.payment?.erpnextPaymentId || 'Synced'}`,
        });
        setShowModal(false);
        fetchData();
      }
    } catch (err: unknown) {
      setMsg({ type: 'error', text: 'Error recording sale transaction' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales & Point of Sale (POS)</h1>
          <p className="text-sm text-slate-500 mt-1">
            Every completed sale automatically creates a <span className="font-semibold text-sky-600">Sales Invoice</span> and <span className="font-semibold text-emerald-600">Payment Entry</span> in ERPNext.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-sm shadow-sky-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New POS Sale</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">ERPNext Invoice</th>
                <th className="py-3 px-4">ERPNext Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sales recorded yet. Click "New POS Sale" to record one!
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">{s.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-slate-700">{s.customer?.name || 'Walk-in Customer'}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(s.saleDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      ₹{Number(s.grandTotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.paymentMethod} · {s.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {s.erpnextInvoiceId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-medium">
                          {s.erpnextInvoiceId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {s.erpnextPaymentId ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                          {s.erpnextPaymentId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-sky-500" />
                New POS Sale Transaction
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Select Product</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stockQuantity}) - ₹{p.sellingPrice}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.stockQuantity || 100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                  </select>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Unit Price:</span>
                  <span className="font-mono font-semibold text-slate-700">₹{unitPrice}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-700">₹{lineTotal}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST (5%):</span>
                  <span className="font-mono font-semibold text-slate-700">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sky-600">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-400 rounded-lg shadow-md shadow-sky-500/25 transition-all flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Submit & Post to ERPNext</span>
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

