/**
 * supplier.service.ts
 * Syncs local Supplier records to ERPNext Supplier doctype via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';

// ─── ERPNext Supplier Shape ───────────────────────────────────────────────────

export interface ErpSupplierPayload {
  supplier_name: string;
  supplier_type: 'Individual' | 'Company';
  supplier_group: string;
  mobile_no?: string;
  email_id?: string;
  tax_id?: string; // GSTIN
}

export interface ErpSupplierDoc extends ErpSupplierPayload {
  name: string;
  docstatus: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpSupplierService {
  /**
   * Create a Supplier in ERPNext.
   * Returns the ERPNext document name (used as erpnextSupplierId in MariaDB).
   */
  public static async createSupplier(data: {
    name: string;
    supplierType: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
  }): Promise<string> {
    const payload: ErpSupplierPayload = {
      supplier_name: data.name,
      supplier_type: data.supplierType === 'Individual' ? 'Individual' : 'Company',
      supplier_group: 'All Supplier Groups',
      ...(data.phone && { mobile_no: data.phone }),
      ...(data.email && { email_id: data.email }),
      ...(data.gstin && { tax_id: data.gstin }),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpSupplierDoc>>(
      '/api/resource/Supplier',
      payload
    );

    return response.data.data.name;
  }

  /**
   * Update an existing Supplier in ERPNext.
   */
  public static async updateSupplier(
    erpnextName: string,
    data: {
      name?: string;
      supplierType?: string;
      phone?: string | null;
      email?: string | null;
      gstin?: string | null;
    }
  ): Promise<void> {
    const payload: Partial<ErpSupplierPayload> = {
      ...(data.name && { supplier_name: data.name }),
      ...(data.supplierType && {
        supplier_type: data.supplierType === 'Individual' ? 'Individual' : 'Company',
      }),
      ...(data.phone !== undefined && { mobile_no: data.phone ?? '' }),
      ...(data.email !== undefined && { email_id: data.email ?? '' }),
      ...(data.gstin !== undefined && { tax_id: data.gstin ?? '' }),
    };

    await erpNextClient.put(
      `/api/resource/Supplier/${encodeURIComponent(erpnextName)}`,
      payload
    );
  }

  /**
   * Check if a Supplier already exists in ERPNext by name.
   */
  public static async findByName(name: string): Promise<string | null> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<ErpSupplierDoc>>(
        `/api/resource/Supplier/${encodeURIComponent(name)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }

  /**
   * Sync supplier to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext supplier name.
   */
  public static async sync(data: {
    name: string;
    supplierType: string;
    phone?: string | null;
    email?: string | null;
    gstin?: string | null;
    existingErpnextId?: string | null;
  }): Promise<string> {
    if (data.existingErpnextId) {
      await this.updateSupplier(data.existingErpnextId, data);
      return data.existingErpnextId;
    }

    // Prevent duplicate creation on retry
    const existing = await this.findByName(data.name);
    if (existing) return existing;

    return this.createSupplier(data);
  }
}

