/**
 * erpnext.service.ts
 * Reusable Axios instance pre-configured with Frappe token authentication.
 * All ERPNext service files must import erpNextClient from here.
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { erpNextConfig, getErpNextAuthHeader } from '../../config/erpnext.config';

// ─── Frappe API Response Shapes ──────────────────────────────────────────────

export interface FrappeDocResponse<T> {
  data: T;
}

export interface FrappeListResponse<T> {
  data: T[];
}

export interface FrappeError {
  exc_type?: string;
  exception?: string;
  _server_messages?: string;
  message?: string;
}

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const erpNextClient: AxiosInstance = axios.create({
  baseURL: erpNextConfig.baseUrl,
  timeout: erpNextConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Inject Frappe token auth header on every request
erpNextClient.interceptors.request.use((reqConfig) => {
  const authHeader = getErpNextAuthHeader();
  if (authHeader) {
    reqConfig.headers['Authorization'] = authHeader;
  }
  return reqConfig;
});

// Log response errors in development
erpNextClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<FrappeError>) => {
    const status = error.response?.status;
    const frappe = error.response?.data;

    let message = `ERPNext API Error ${status ?? 'NETWORK'}`;

    if (frappe?._server_messages) {
      try {
        const parsed = JSON.parse(frappe._server_messages) as string[];
        const inner = JSON.parse(parsed[0]) as { message?: string };
        message = inner.message ?? message;
      } catch {
        message = frappe._server_messages;
      }
    } else if (frappe?.exception) {
      message = frappe.exception;
    } else if (frappe?.message) {
      message = frappe.message;
    } else if (error.message) {
      message = error.message;
    }

    const enrichedError = new Error(message) as Error & { statusCode: number };
    enrichedError.statusCode = status ?? 503;
    return Promise.reject(enrichedError);
  }
);

// ─── Helper: Submit a Frappe document ────────────────────────────────────────

export const submitFrappeDoc = async (doctype: string, name: string): Promise<void> => {
  await erpNextClient.post(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
    docstatus: 1,
  });
};

// ─── Helper: Check ERPNext connectivity ──────────────────────────────────────

export const pingErpNext = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    await erpNextClient.get('/api/method/frappe.auth.get_logged_user');
    return { ok: true, message: 'ERPNext connection successful.' };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, message: `ERPNext unreachable: ${msg}` };
  }
};

