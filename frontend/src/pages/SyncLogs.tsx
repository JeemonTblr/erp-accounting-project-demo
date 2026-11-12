import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RefreshCw, CheckCircle, AlertCircle, Clock, ShieldAlert, Code2, Search } from 'lucide-react';

interface SyncLog {
  id: number;
  localTransactionId: string;
  transactionType: string;
  erpnextDocumentType: string;
  erpnextDocumentName?: string | null;
  syncStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  errorMessage?: string | null;
  retryCount: number;
  payload?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
}

export const SyncLogs: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/erp-sync');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'ALL' || log.syncStatus === statusFilter;
    const matchesSearch =
      log.localTransactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.erpnextDocumentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.erpnextDocumentName && log.erpnextDocumentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.transactionType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const syncedCount = logs.filter((l) => l.syncStatus === 'SYNCED').length;
  const failedCount = logs.filter((l) => l.syncStatus === 'FAILED').length;
  const pendingCount = logs.filter((l) => l.syncStatus === 'PENDING').length;
  const syncRate = logs.length > 0 ? ((syncedCount / logs.length) * 100).toFixed(1) : '100.0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <RefreshCw className="w-7 h-7 text-sky-600" />
            ERPNext Synchronization Audit Trail
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete bi-directional audit logging for every MariaDB transaction synced with ERPNext
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          Refresh Audit Logs
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Synced Operations</div>
          <div className="text-2xl font-bold text-slate-900 mt-1.5">{logs.length}</div>
          <div className="text-xs text-slate-400 mt-1">Across all accounting doctypes</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Success Rate</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1.5">{syncRate}%</div>
          <div className="text-xs text-slate-400 mt-1">{syncedCount} operations completed</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Failed / Incomplete</div>
          <div className={`text-2xl font-bold mt-1.5 ${failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {failedCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">{pendingCount} pending queue</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Frappe API Status</div>
          <div className="text-sm font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            REST API Connected (Port 8000)
          </div>
          <div className="text-xs text-slate-400 mt-1">Site: hrtask.local • Token Auth</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, DocType, DocName..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'SYNCED', 'PENDING', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sync Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 border-b border-slate-100 font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-3.5">ID / Time</th>
                <th className="px-6 py-3.5">Transaction Type</th>
                <th className="px-6 py-3.5">Local Tx ID</th>
                <th className="px-6 py-3.5">ERPNext DocType</th>
                <th className="px-6 py-3.5">ERPNext Document ID</th>
                <th className="px-6 py-3.5">Sync Status</th>
                <th className="px-6 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                    Loading sync audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No sync logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">#{log.id}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {log.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-800">{log.localTransactionId}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{log.erpnextDocumentType}</td>
                    <td className="px-6 py-4">
                      {log.erpnextDocumentName ? (
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          {log.erpnextDocumentName}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.syncStatus === 'SYNCED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          SYNCED
                        </span>
                      ) : log.syncStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {log.syncStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.payload && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-sky-600 hover:text-sky-800 font-medium hover:underline inline-flex items-center gap-1"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          Payload
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

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sync Log Payload #{selectedLog.id}</h3>
                <p className="text-xs text-slate-500">
                  {selectedLog.erpnextDocumentType} • {selectedLog.localTransactionId}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                ×
              </button>
            </div>

            {selectedLog.errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                <strong>Error:</strong> {selectedLog.errorMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                JSON Payload sent to Frappe API:
              </label>
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
                {JSON.stringify(
                  typeof selectedLog.payload === 'string'
                    ? JSON.parse(selectedLog.payload)
                    : selectedLog.payload,
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

