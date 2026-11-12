/**
 * payment-entry.service.ts
 * Creates and submits Payment Entries in ERPNext against Invoices via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';
import { erpNextConfig } from '../../config/erpnext.config';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface ErpPaymentEntryReference {
  reference_doctype: 'Sales Invoice' | 'Purchase Invoice';
  reference_name: string;
  total_amount: number;
  outstanding_amount: number;
  allocated_amount: number;
}

export interface ErpPaymentEntryPayload {
  doctype: 'Payment Entry';
  payment_type: 'Receive' | 'Pay';
  party_type: 'Customer' | 'Supplier';
  party: string;
  company: string;
  posting_date: string;
  mode_of_payment: string;
  paid_to?: string;   // For Receive: Cash or Bank asset account
  paid_from?: string; // For Pay: Cash or Bank asset account
  paid_amount: number;
  received_amount: number;
  reference_no?: string;
  reference_date?: string;
  references?: ErpPaymentEntryReference[];
  remarks?: string;
}

export interface ErpPaymentEntryDoc extends ErpPaymentEntryPayload {
  name: string;
  docstatus: number;
  status: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpPaymentEntryService {
  /**
   * Determine the appropriate ERPNext Mode of Payment and Account
   * based on the local payment method.
   */
  public static resolvePaymentAccount(paymentMethod: string): {
    modeOfPayment: string;
    account: string;
  } {
    const method = (paymentMethod || 'CASH').toUpperCase();
    switch (method) {
      case 'BANK':
      case 'WIRE_TRANSFER':
        return { modeOfPayment: 'Wire Transfer', account: 'HDFC Bank - C' };
      case 'UPI':
        return { modeOfPayment: 'Wire Transfer', account: 'HDFC Bank - C' };
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return { modeOfPayment: 'Credit Card', account: 'HDFC Bank - C' };
      case 'CASH':
      default:
        return { modeOfPayment: 'Cash', account: 'Cash - C' };
    }
  }

  /**
   * Create a draft Payment Entry in ERPNext for a customer receipt.
   */
  public static async createCustomerPayment(data: {
    customerName: string;
    amount: number;
    paymentMethod: string;
    postingDate?: string;
    invoiceName?: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<ErpPaymentEntryDoc> {
    const today = new Date().toISOString().split('T')[0];
    const { modeOfPayment, account } = this.resolvePaymentAccount(data.paymentMethod);

    const payload: ErpPaymentEntryPayload = {
      doctype: 'Payment Entry',
      payment_type: 'Receive',
      party_type: 'Customer',
      party: data.customerName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      mode_of_payment: modeOfPayment,
      paid_to: account,
      paid_amount: Number(data.amount),
      received_amount: Number(data.amount),
      reference_no: data.referenceNumber || `PAY-${Date.now()}`,
      reference_date: data.postingDate || today,
      ...(data.remarks && { remarks: data.remarks }),
      ...(data.invoiceName && {
        references: [
          {
            reference_doctype: 'Sales Invoice',
            reference_name: data.invoiceName,
            total_amount: Number(data.amount),
            outstanding_amount: Number(data.amount),
            allocated_amount: Number(data.amount),
          },
        ],
      }),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpPaymentEntryDoc>>(
      '/api/resource/Payment%20Entry',
      payload
    );

    return response.data.data;
  }

  /**
   * Create a draft Payment Entry in ERPNext for paying a supplier.
   */
  public static async createSupplierPayment(data: {
    supplierName: string;
    amount: number;
    paymentMethod?: string;
    postingDate?: string;
    invoiceName?: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<ErpPaymentEntryDoc> {
    const today = new Date().toISOString().split('T')[0];
    const { modeOfPayment, account } = this.resolvePaymentAccount(data.paymentMethod || 'WIRE_TRANSFER');

    const payload: ErpPaymentEntryPayload = {
      doctype: 'Payment Entry',
      payment_type: 'Pay',
      party_type: 'Supplier',
      party: data.supplierName,
      company: erpNextConfig.company,
      posting_date: data.postingDate || today,
      mode_of_payment: modeOfPayment,
      paid_from: account,
      paid_amount: Number(data.amount),
      received_amount: Number(data.amount),
      reference_no: data.referenceNumber || `PUR-PAY-${Date.now()}`,
      reference_date: data.postingDate || today,
      ...(data.remarks && { remarks: data.remarks }),
      ...(data.invoiceName && {
        references: [
          {
            reference_doctype: 'Purchase Invoice',
            reference_name: data.invoiceName,
            total_amount: Number(data.amount),
            outstanding_amount: Number(data.amount),
            allocated_amount: Number(data.amount),
          },
        ],
      }),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpPaymentEntryDoc>>(
      '/api/resource/Payment%20Entry',
      payload
    );

    return response.data.data;
  }

  /**
   * Submit an existing draft Payment Entry in ERPNext.
   */
  public static async submitPayment(paymentName: string): Promise<ErpPaymentEntryDoc> {
    const response = await erpNextClient.put<FrappeDocResponse<ErpPaymentEntryDoc>>(
      `/api/resource/Payment%20Entry/${encodeURIComponent(paymentName)}`,
      { docstatus: 1 }
    );
    return response.data.data;
  }

  /**
   * Helper: Create and immediately Submit a Customer Payment Entry.
   */
  public static async createAndSubmitCustomerPayment(data: {
    customerName: string;
    amount: number;
    paymentMethod: string;
    postingDate?: string;
    invoiceName?: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<{ paymentName: string; paidAmount: number }> {
    const draft = await this.createCustomerPayment(data);
    const submitted = await this.submitPayment(draft.name);
    return {
      paymentName: submitted.name,
      paidAmount: submitted.paid_amount,
    };
  }

  /**
   * Helper: Create and immediately Submit a Supplier Payment Entry.
   */
  public static async createAndSubmitSupplierPayment(data: {
    supplierName: string;
    amount: number;
    paymentMethod?: string;
    postingDate?: string;
    invoiceName?: string;
    referenceNumber?: string;
    remarks?: string;
  }): Promise<{ paymentName: string; paidAmount: number }> {
    const draft = await this.createSupplierPayment(data);
    const submitted = await this.submitPayment(draft.name);
    return {
      paymentName: submitted.name,
      paidAmount: submitted.paid_amount,
    };
  }
}
