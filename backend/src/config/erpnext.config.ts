import { config } from './env';

export interface ErpNextConfig {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  company: string;
  timeout: number;
}

export const erpNextConfig: ErpNextConfig = {
  baseUrl: config.erpnext.baseUrl,
  apiKey: config.erpnext.apiKey,
  apiSecret: config.erpnext.apiSecret,
  company: config.erpnext.company,
  timeout: 15000,
};

export const getErpNextAuthHeader = (): string => {
  if (erpNextConfig.apiKey && erpNextConfig.apiSecret) {
    return `token ${erpNextConfig.apiKey}:${erpNextConfig.apiSecret}`;
  }
  return '';
};

