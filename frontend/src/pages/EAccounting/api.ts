import { api } from '../../api/client';

const PROXY_BASE = '/plugins/accounting/proxy';

export const eaccountingApi = {
  dailyIncome: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-income/summary`);
      return res.data?.data;
    },
    getInvoices: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-income/invoices`);
      return res.data?.data || [];
    },
    getReceipts: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-income/receipts`);
      return res.data?.data || [];
    },
  },

  foundation: {
    getConfig: async () => {
      const res = await api.get(`${PROXY_BASE}/foundation/config`);
      return res.data?.data;
    },
    getChartOfAccounts: async () => {
      const res = await api.get(`${PROXY_BASE}/foundation/chart-of-accounts`);
      return res.data?.data || [];
    },
    getRoles: async () => {
      const res = await api.get(`${PROXY_BASE}/foundation/roles`);
      return res.data?.data || [];
    },
    getAuditTrail: async () => {
      const res = await api.get(`${PROXY_BASE}/foundation/audit-trail`);
      return res.data?.data || [];
    },
  },

  expenses: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-expenses/summary`);
      return res.data?.data;
    },
    getEntries: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-expenses/entries`);
      return res.data?.data || [];
    },
    getCategories: async () => {
      const res = await api.get(`${PROXY_BASE}/daily-expenses/categories`);
      return res.data?.data || [];
    },
  },

  purchases: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/purchase-management/summary`);
      return res.data?.data;
    },
    getSuppliers: async () => {
      const res = await api.get(`${PROXY_BASE}/purchase-management/suppliers`);
      return res.data?.data || [];
    },
    getBills: async () => {
      const res = await api.get(`${PROXY_BASE}/purchase-management/bills`);
      return res.data?.data || [];
    },
  },

  pnl: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/profit-loss/summary`);
      return res.data?.data;
    },
    getComparison: async () => {
      const res = await api.get(`${PROXY_BASE}/profit-loss/comparison`);
      return res.data?.data || [];
    },
    getAccounts: async () => {
      const res = await api.get(`${PROXY_BASE}/profit-loss/accounts`);
      return res.data?.data || [];
    },
  },

  balance: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/balance-sheet/summary`);
      return res.data?.data;
    },
    getComparison: async () => {
      const res = await api.get(`${PROXY_BASE}/balance-sheet/comparison`);
      return res.data?.data || [];
    },
    getAccounts: async () => {
      const res = await api.get(`${PROXY_BASE}/balance-sheet/accounts`);
      return res.data?.data || [];
    },
  },

  cashbank: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/cash-bank/summary`);
      return res.data?.data;
    },
    getAccounts: async () => {
      const res = await api.get(`${PROXY_BASE}/cash-bank/accounts`);
      return res.data?.data || [];
    },
    getCashBook: async () => {
      const res = await api.get(`${PROXY_BASE}/cash-bank/cashbook`);
      return res.data?.data || [];
    },
  },

  reports: {
    getDayBook: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/day-book`);
      return res.data?.data || [];
    },
    getPeriods: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/periods`);
      return res.data?.data || [];
    },
    getTrialBalance: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/trial-balance`);
      return res.data?.data || [];
    },
    getCashFlow: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/cash-flow`);
      return res.data?.data;
    },
    getTax: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/tax`);
      return res.data?.data;
    },
    getCharts: async () => {
      const res = await api.get(`${PROXY_BASE}/reports/charts`);
      return res.data?.data || [];
    },
  },

  outstanding: {
    getSummary: async () => {
      const res = await api.get(`${PROXY_BASE}/outstanding/summary`);
      return res.data?.data;
    },
    getCustomers: async () => {
      const res = await api.get(`${PROXY_BASE}/outstanding/customers`);
      return res.data?.data || [];
    },
    getSuppliers: async () => {
      const res = await api.get(`${PROXY_BASE}/outstanding/suppliers`);
      return res.data?.data || [];
    },
    getAging: async () => {
      const res = await api.get(`${PROXY_BASE}/outstanding/aging`);
      return res.data?.data || [];
    },
    getStatements: async () => {
      const res = await api.get(`${PROXY_BASE}/outstanding/statements`);
      return res.data?.data || [];
    },
  },
};

