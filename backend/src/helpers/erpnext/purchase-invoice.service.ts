/**
 * purchase-invoice.service.ts
 * Creates and submits Purchase Invoices in ERPNext via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';
import { erpNextConfig } from '../../config/erpnext.config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ErpPurchaseInvoiceItem {
  item_code: string;
  qty: number;
  rate: number;
  description?: string;
  warehouse?: string;
  expense_account?: string;
}

export interface ErpPurchaseInvoicePayload {
  supplier: string;
  company: string;
  posting_date: string;
  due_date: string;
  items: ErpPurchaseInvoiceItem[];
  remarks?: string;
  update_stock?: number;
}

export interface ErpPurchaseInvoiceDoc extends ErpPurchaseInvoicePayload {
  name: string;
  grand_total: number;
  outstanding_amount: number;
  status: string;
  docstatus: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpPurchaseInvoiceService {
  /**
   * Create a draft Purchase Invoice in ERPNext.
   */
  public static async createInvoice(data: {
    supplierName: string;
    postingDate?: string;
    dueDate?: string;
    items: Array<{
      itemCode: string;
      qty: number;
      rate: number;
      description?: string;
    }>;
    remarks?: string;
    updateStock?: boolean;
  }): Promise<ErpPurchaseInvoiceDoc> {
    const today = new Date().toISOString().split('T')[0];
    const payload: ErpPurchaseInvoicePayload = {
      supplier: data.supplierName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      due_date: data.dueDate || today,
      items: data.items.map((item) => ({
        item_code: item.itemCode,
        qty: Number(item.qty),
        rate: Number(item.rate),
        ...(item.description && { description: item.description }),
      })),
      ...(data.remarks && { remarks: data.remarks }),
      update_stock: data.updateStock ? 1 : 0,
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpPurchaseInvoiceDoc>>(
      '/api/resource/Purchase%20Invoice',
      payload
    );

    return response.data.data;
  }

  /**
   * Submit an existing draft Purchase Invoice in ERPNext.
   */
  public static async submitInvoice(invoiceName: string): Promise<ErpPurchaseInvoiceDoc> {
    const response = await erpNextClient.put<FrappeDocResponse<ErpPurchaseInvoiceDoc>>(
      `/api/resource/Purchase%20Invoice/${encodeURIComponent(invoiceName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }

  /**
   * Helper: Create and immediately Submit a Purchase Invoice in ERPNext.
   * Returns the ERPNext document name (e.g. "ACC-PINV-2026-00001").
   */
  public static async createAndSubmitPurchaseInvoice(data: {
    supplierName: string;
    postingDate?: string;
    dueDate?: string;
    items: Array<{
      itemCode: string;
      qty: number;
      rate: number;
      description?: string;
    }>;
    remarks?: string;
    updateStock?: boolean;
  }): Promise<{ invoiceName: string; grandTotal: number }> {
    const draft = await this.createInvoice(data);
    const submitted = await this.submitInvoice(draft.name);
    return {
      invoiceName: submitted.name,
      grandTotal: submitted.grand_total,
    };
  }

  /**
   * Fetch invoice details from ERPNext.
   */
  public static async getInvoice(invoiceName: string): Promise<ErpPurchaseInvoiceDoc | null> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<ErpPurchaseInvoiceDoc>>(
        `/api/resource/Purchase%20Invoice/${encodeURIComponent(invoiceName)}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  }
}

