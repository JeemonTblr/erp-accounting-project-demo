/**
 * expense.service.ts
 * Creates and submits Journal Entries in ERPNext for shop expenses via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';
import { erpNextConfig } from '../../config/erpnext.config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ErpJournalEntryAccount {
  account: string;
  debit_in_account_currency: number;
  credit_in_account_currency: number;
  cost_center?: string;
  user_remark?: string;
}

export interface ErpJournalEntryPayload {
  doctype: 'Journal Entry';
  voucher_type: 'Journal Entry';
  company: string;
  posting_date: string;
  user_remark?: string;
  accounts: ErpJournalEntryAccount[];
}

export interface ErpJournalEntryDoc extends ErpJournalEntryPayload {
  name: string;
  docstatus: number;
  total_debit: number;
  total_credit: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpExpenseService {
  /**
   * Map local shop expense category to the appropriate ERPNext Expense Account.
   */
  public static resolveExpenseAccount(category: string): string {
    const cat = (category || '').toLowerCase().trim();

    if (cat.includes('rent')) {
      return 'Office Rent - C';
    }
    if (cat.includes('electric') || cat.includes('water') || cat.includes('utility')) {
      return 'Utility Expenses - C';
    }
    if (cat.includes('internet') || cat.includes('phone') || cat.includes('telephone') || cat.includes('wifi')) {
      return 'Telephone Expenses - C';
    }
    if (cat.includes('transport') || cat.includes('travel') || cat.includes('fuel') || cat.includes('freight')) {
      return 'Travel Expenses - C';
    }
    if (cat.includes('maintain') || cat.includes('repair') || cat.includes('cleaning')) {
      return 'Office Maintenance Expenses - C';
    }
    if (cat.includes('market') || cat.includes('adver') || cat.includes('promo')) {
      return 'Marketing Expenses - C';
    }
    if (cat.includes('print') || cat.includes('stationery') || cat.includes('paper')) {
      return 'Print and Stationery - C';
    }
    if (cat.includes('salary') || cat.includes('wage')) {
      return 'Salary - C';
    }

    return 'Miscellaneous Expenses - C';
  }

  /**
   * Map payment method to the corresponding ERPNext Asset Account (Cash / Bank).
   */
  public static resolveCreditAccount(paymentMethod: string): string {
    const method = (paymentMethod || 'CASH').toUpperCase();
    switch (method) {
      case 'BANK':
      case 'UPI':
      case 'DEBIT_CARD':
      case 'CREDIT_CARD':
        return 'HDFC Bank - C';
      case 'CASH':
      default:
        return 'Cash - C';
    }
  }

  /**
   * Create a draft Journal Entry in ERPNext for a shop expense.
   */
  public static async createJournalEntry(data: {
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    postingDate?: string;
    description?: string;
    referenceNumber?: string;
  }): Promise<ErpJournalEntryDoc> {
    const today = new Date().toISOString().split('T')[0];
    const expenseAccount = this.resolveExpenseAccount(data.category);
    const creditAccount = this.resolveCreditAccount(data.paymentMethod);
    const amount = Number(data.amount);

    const remark = data.description
      ? `${data.title}: ${data.description}`
      : `${data.title} (${data.category}) - Ref: ${data.referenceNumber || 'N/A'}`;

    const payload: ErpJournalEntryPayload = {
      doctype: 'Journal Entry',
      voucher_type: 'Journal Entry',
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      user_remark: remark,
      accounts: [
        {
          account: expenseAccount,
          debit_in_account_currency: amount,
          credit_in_account_currency: 0.0,
        },
        {
          account: creditAccount,
          debit_in_account_currency: 0.0,
          credit_in_account_currency: amount,
        },
      ],
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpJournalEntryDoc>>(
      '/api/resource/Journal%20Entry',
      payload
    );

    return response.data.data;
  }

  /**
   * Submit an existing draft Journal Entry in ERPNext.
   */
  public static async submitJournalEntry(entryName: string): Promise<ErpJournalEntryDoc> {
    const response = await erpNextClient.put<FrappeDocResponse<ErpJournalEntryDoc>>(
      `/api/resource/Journal%20Entry/${encodeURIComponent(entryName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }

  /**
   * Helper: Create and immediately Submit a Journal Entry in ERPNext.
   * Returns the ERPNext document name (e.g. "ACC-JV-2026-00001").
   */
  public static async createAndSubmitJournalEntry(data: {
    title: string;
    category: string;
    amount: number;
    paymentMethod: string;
    postingDate?: string;
    description?: string;
    referenceNumber?: string;
  }): Promise<{ journalEntryName: string; totalDebit: number }> {
    const draft = await this.createJournalEntry(data);
    const submitted = await this.submitJournalEntry(draft.name);
    return {
      journalEntryName: submitted.name,
      totalDebit: submitted.total_debit,
    };
  }

  /**
   * Fetch Journal Entry details from ERPNext.
   */
  public static async getJournalEntry(entryName: string): Promise<ErpJournalEntryDoc | null> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<ErpJournalEntryDoc>>(
        `/api/resource/Journal%20Entry/${encodeURIComponent(entryName)}`
      );
      return response.data.data;
    } catch {
      return null;
    }
  }
}

