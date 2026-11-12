/**
 * stock.service.ts
 * Manages ERPNext Stock Entries (Material Receipt, Material Issue) and Stock Balance queries.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';
import { erpNextConfig } from '../../config/erpnext.config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ErpStockEntryItem {
  item_code: string;
  qty: number;
  s_warehouse?: string; // Source warehouse for Material Issue
  t_warehouse?: string; // Target warehouse for Material Receipt
  basic_rate?: number;
  expense_account?: string;
  cost_center?: string;
}

export interface ErpStockEntryPayload {
  doctype: 'Stock Entry';
  stock_entry_type: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  purpose?: string;
  company: string;
  posting_date: string;
  items: ErpStockEntryItem[];
  remarks?: string;
}

export interface ErpStockEntryDoc extends ErpStockEntryPayload {
  name: string;
  docstatus: number;
  total_amount: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpStockService {
  public static readonly DEFAULT_WAREHOUSE = 'Stores - C';
  public static readonly DEFAULT_EXPENSE_ACCOUNT = 'Stock Adjustment - C';

  /**
   * Create a draft Stock Entry in ERPNext.
   */
  public static async createStockEntry(data: {
    entryType: 'Material Receipt' | 'Material Issue';
    postingDate?: string;
    warehouse?: string;
    remarks?: string;
    items: Array<{
      itemCode: string;
      qty: number;
      rate?: number;
    }>;
  }): Promise<ErpStockEntryDoc> {
    const today = new Date().toISOString().split('T')[0];
    const warehouse = data.warehouse || this.DEFAULT_WAREHOUSE;

    const payload: ErpStockEntryPayload = {
      doctype: 'Stock Entry',
      stock_entry_type: data.entryType,
      purpose: data.entryType,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      ...(data.remarks && { remarks: data.remarks }),
      items: data.items.map((item) => ({
        item_code: item.itemCode,
        qty: Number(item.qty),
        ...(data.entryType === 'Material Issue'
          ? { s_warehouse: warehouse, expense_account: this.DEFAULT_EXPENSE_ACCOUNT }
          : { t_warehouse: warehouse, expense_account: this.DEFAULT_EXPENSE_ACCOUNT }),
        ...(item.rate !== undefined && { basic_rate: Number(item.rate) }),
      })),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpStockEntryDoc>>(
      '/api/resource/Stock%20Entry',
      payload
    );

    return response.data.data;
  }

  /**
   * Submit an existing draft Stock Entry in ERPNext.
   */
  public static async submitStockEntry(entryName: string): Promise<ErpStockEntryDoc> {
    const response = await erpNextClient.put<FrappeDocResponse<ErpStockEntryDoc>>(
      `/api/resource/Stock%20Entry/${encodeURIComponent(entryName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }

  /**
   * Helper: Create and immediately Submit a Stock Entry.
   * Returns ERPNext document name.
   */
  public static async createAndSubmitStockEntry(data: {
    entryType: 'Material Receipt' | 'Material Issue';
    postingDate?: string;
    warehouse?: string;
    remarks?: string;
    items: Array<{
      itemCode: string;
      qty: number;
      rate?: number;
    }>;
  }): Promise<{ stockEntryName: string; totalAmount: number }> {
    const draft = await this.createStockEntry(data);
    const submitted = await this.submitStockEntry(draft.name);
    return {
      stockEntryName: submitted.name,
      totalAmount: submitted.total_amount,
    };
  }

  /**
   * Query official stock balance for an item in ERPNext warehouse.
   */
  public static async getStockBalance(itemCode: string, warehouse?: string): Promise<number> {
    const wh = warehouse || this.DEFAULT_WAREHOUSE;
    try {
      const response = await erpNextClient.get<FrappeDocResponse<{ actual_qty: number }>>(
        '/api/method/erpnext.stock.utils.get_stock_balance',
        {
          params: {
            item_code: itemCode,
            warehouse: wh,
          },
        }
      );
      return Number(response.data.data?.actual_qty ?? response.data.data ?? 0);
    } catch {
      return 0;
    }
  }
}

