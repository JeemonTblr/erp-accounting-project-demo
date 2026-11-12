/**
 * customer.service.ts
 * Syncs local Customer records to ERPNext Customer doctype via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';

// ─── ERPNext Customer Shape ───────────────────────────────────────────────────

export interface ErpCustomerPayload {
  customer_name: string;
  customer_type: 'Individual' | 'Company';
  customer_group: string;
  territory: string;
  mobile_no?: string;
  email_id?: string;
  customer_primary_address?: string;
  tax_id?: string; // GSTIN
}

export interface ErpCustomerDoc extends ErpCustomerPayload {
  name: string;         // ERPNext document name (e.g. "John Doe")
  docstatus: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpCustomerService {
  /**
   * Create a Customer in ERPNext.
   * Returns the ERPNext document name (used as erpnextCustomerId in MariaDB).
   */
  public static async createCustomer(data: {
    name: string;
    customerType: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
  }): Promise<string> {
    const isCompany = data.customerType === 'Company' || data.customerType === 'Wholesaler' || data.customerType === 'Corporate';
    const payload: ErpCustomerPayload = {
      customer_name: data.name,
      customer_type: isCompany ? 'Company' : 'Individual',
      customer_group: isCompany ? 'Commercial' : 'Individual',
      territory: 'All Territories',
      ...(data.phone && { mobile_no: data.phone }),
      ...(data.email && { email_id: data.email }),
      ...(data.gstin && { tax_id: data.gstin }),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpCustomerDoc>>(
      '/api/resource/Customer',
      payload
    );

    return response.data.data.name;
  }

  /**
   * Update an existing Customer in ERPNext.
   */
  public static async updateCustomer(
    erpnextName: string,
    data: {
      name?: string;
      customerType?: string;
      phone?: string | null;
      email?: string | null;
      gstin?: string | null;
    }
  ): Promise<void> {
    const isCompany = data.customerType === 'Company' || data.customerType === 'Wholesaler' || data.customerType === 'Corporate';
    const payload: Partial<ErpCustomerPayload> = {
      ...(data.name && { customer_name: data.name }),
      ...(data.customerType && {
        customer_type: isCompany ? 'Company' : 'Individual',
        customer_group: isCompany ? 'Commercial' : 'Individual',
      }),
      ...(data.phone !== undefined && { mobile_no: data.phone ?? '' }),
      ...(data.email !== undefined && { email_id: data.email ?? '' }),
      ...(data.gstin !== undefined && { tax_id: data.gstin ?? '' }),
    };

    await erpNextClient.put(
      `/api/resource/Customer/${encodeURIComponent(erpnextName)}`,
      payload
    );
  }

  /**
   * Check if a Customer already exists in ERPNext by name.
   */
  public static async findByName(name: string): Promise<string | null> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<ErpCustomerDoc>>(
        `/api/resource/Customer/${encodeURIComponent(name)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }

  /**
   * Get outstanding receivable amount for a customer from ERPNext.
   */
  public static async getOutstanding(erpnextName: string): Promise<number> {
    const response = await erpNextClient.get<FrappeDocResponse<{ outstanding_amount: number }>>(
      '/api/method/frappe.client.get_value',
      {
        params: {
          doctype: 'Customer',
          filters: JSON.stringify({ name: erpnextName }),
          fieldname: JSON.stringify(['outstanding_amount']),
        },
      }
    );
    return response.data.data?.outstanding_amount ?? 0;
  }

  /**
   * Sync customer to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext customer name.
   */
  public static async sync(data: {
    name: string;
    customerType: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    existingErpnextId?: string | null;
  }): Promise<string> {
    if (data.existingErpnextId) {
      await this.updateCustomer(data.existingErpnextId, data);
      return data.existingErpnextId;
    }

    // Check if already exists in ERPNext (prevent duplicates on retry)
    const existing = await this.findByName(data.name);
    if (existing) return existing;

    return this.createCustomer(data);
  }
}
