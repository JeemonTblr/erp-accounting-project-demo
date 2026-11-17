import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export interface AccountingPluginInfo {
  name: string;
  source: string;
  baseUrl: string;
  mode: 'erpnext' | 'eaccounting';
  isErpAccounting: boolean;
}

interface AccountingContextType {
  pluginInfo: AccountingPluginInfo;
  isErpAccounting: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultPluginInfo: AccountingPluginInfo = {
  name: 'ERPNext Accounting Module',
  source: 'ERPNext Accounting Module',
  baseUrl: 'http://127.0.0.1:8000',
  mode: 'erpnext',
  isErpAccounting: true,
};

const AccountingContext = createContext<AccountingContextType>({
  pluginInfo: defaultPluginInfo,
  isErpAccounting: true,
  loading: false,
  refresh: async () => {},
});

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pluginInfo, setPluginInfo] = useState<AccountingPluginInfo>(defaultPluginInfo);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAccountingInfo = useCallback(async () => {
    try {
      const res = await api.get('/plugins/accounting/info');
      if (res.data?.success && res.data?.active) {
        setPluginInfo({
          name: res.data.active.name || 'ERPNext Accounting Module',
          source: res.data.active.source || 'ERPNext Accounting Module',
          baseUrl: res.data.active.baseUrl || 'http://127.0.0.1:8000',
          mode: res.data.active.mode || 'erpnext',
          isErpAccounting: res.data.active.isErpAccounting !== false,
        });
      }
    } catch (err) {
      console.warn('Could not fetch accounting plugin info:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccountingInfo();
  }, [fetchAccountingInfo]);

  return (
    <AccountingContext.Provider
      value={{
        pluginInfo,
        isErpAccounting: pluginInfo.isErpAccounting,
        loading,
        refresh: fetchAccountingInfo,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => useContext(AccountingContext);

