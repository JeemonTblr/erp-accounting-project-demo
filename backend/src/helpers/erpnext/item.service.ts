/**
 * item.service.ts
 * Syncs local Product records to ERPNext Item doctype via Frappe REST API.
 */
import { erpNextClient, FrappeDocResponse } from './erpnext.service';

// ─── ERPNext Item Shape ───────────────────────────────────────────────────────

export interface ErpItemPayload {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: 1 | 0;
  description?: string;
  brand?: string;
  standard_rate: number;
  valuation_rate: number;
  opening_stock?: number;
  gst_hsn_code?: string;
}

export interface ErpItemDoc extends ErpItemPayload {
  name: string;
  docstatus: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ErpItemService {
  /**
   * Ensure a Brand exists in ERPNext before assigning to an item.
   */
  public static async ensureBrand(brandName: string): Promise<void> {
    try {
      await erpNextClient.get(`/api/resource/Brand/${encodeURIComponent(brandName)}`);
    } catch {
      try {
        await erpNextClient.post('/api/resource/Brand', { brand: brandName });
      } catch (e) {
        console.warn(`Could not auto-create brand ${brandName} in ERPNext:`, e);
      }
    }
  }

  /**
   * Determine the ERPNext item group based on local category.
   * Standard valid non-group item groups: "Products", "Raw Material", "Consumable"
   */
  public static resolveItemGroup(categoryName?: string | null): string {
    if (!categoryName) return 'Products';
    if (categoryName.toLowerCase().includes('fabric') || categoryName.toLowerCase().includes('raw')) {
      return 'Raw Material';
    }
    return 'Products';
  }

  /**
   * Create an Item in ERPNext.
   * Returns the ERPNext item_code (used as erpnextItemCode in MariaDB).
   */
  public static async createItem(data: {
    sku: string;
    name: string;
    categoryName?: string | null;
    brand?: string | null;
    sellingPrice: number;
    purchasePrice: number;
    stockQuantity?: number;
    gstRate?: number;
  }): Promise<string> {
    if (data.brand && data.brand.trim()) {
      await this.ensureBrand(data.brand.trim());
    }

    const payload: ErpItemPayload = {
      item_code:        data.sku,
      item_name:        data.name,
      item_group:       this.resolveItemGroup(data.categoryName),
      stock_uom:        'Nos',
      is_stock_item:    1,
      standard_rate:    data.sellingPrice,
      valuation_rate:   data.purchasePrice,
      opening_stock:    data.stockQuantity ?? 0,
      ...(data.brand && { brand: data.brand.trim() }),
    };

    const response = await erpNextClient.post<FrappeDocResponse<ErpItemDoc>>(
      '/api/resource/Item',
      payload
    );

    return response.data.data.name;
  }

  /**
   * Update an existing Item in ERPNext.
   */
  public static async updateItem(
    erpnextCode: string,
    data: {
      name?: string;
      sellingPrice?: number;
      purchasePrice?: number;
      brand?: string | null;
      categoryName?: string | null;
    }
  ): Promise<void> {
    if (data.brand && data.brand.trim()) {
      await this.ensureBrand(data.brand.trim());
    }

    const payload: Partial<ErpItemPayload> = {
      ...(data.name && { item_name: data.name }),
      ...(data.sellingPrice !== undefined && { standard_rate: data.sellingPrice }),
      ...(data.purchasePrice !== undefined && { valuation_rate: data.purchasePrice }),
      ...(data.brand !== undefined && { brand: data.brand ? data.brand.trim() : '' }),
      ...(data.categoryName && {
        item_group: this.resolveItemGroup(data.categoryName),
      }),
    };

    await erpNextClient.put(
      `/api/resource/Item/${encodeURIComponent(erpnextCode)}`,
      payload
    );
  }

  /**
   * Check if an Item already exists in ERPNext by item_code (SKU).
   */
  public static async findBySku(sku: string): Promise<string | null> {
    try {
      const response = await erpNextClient.get<FrappeDocResponse<ErpItemDoc>>(
        `/api/resource/Item/${encodeURIComponent(sku)}`
      );
      return response.data.data.name;
    } catch {
      return null;
    }
  }

  /**
   * Sync item to ERPNext — creates if not exists, updates if already synced.
   * Returns ERPNext item code.
   */
  public static async sync(data: {
    sku: string;
    name: string;
    categoryName?: string | null;
    brand?: string | null;
    sellingPrice: number;
    purchasePrice: number;
    stockQuantity?: number;
    gstRate?: number;
    existingErpnextCode?: string | null;
  }): Promise<string> {
    if (data.existingErpnextCode) {
      await this.updateItem(data.existingErpnextCode, data);
      return data.existingErpnextCode;
    }

    const existing = await this.findBySku(data.sku);
    if (existing) return existing;

    return this.createItem(data);
  }
}
