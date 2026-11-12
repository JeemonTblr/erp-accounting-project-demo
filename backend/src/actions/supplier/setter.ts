import { Supplier } from '../../models/supplier.model';

export class SupplierSetter {
  public static async createSupplier(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    supplierType?: string;
    erpnextSupplierId?: string | null;
    isActive?: boolean;
  }): Promise<Supplier> {
    return Supplier.create({
      name: data.name.trim(),
      phone: data.phone ? data.phone.trim() : null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      address: data.address ? data.address.trim() : null,
      gstin: data.gstin ? data.gstin.trim() : null,
      supplierType: data.supplierType || 'Wholesaler',
      erpnextSupplierId: data.erpnextSupplierId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  public static async updateSupplier(
    id: number,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      gstin?: string | null;
      supplierType?: string;
      erpnextSupplierId?: string | null;
      isActive?: boolean;
    }
  ): Promise<Supplier> {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) supplier.name = data.name.trim();
    if (data.phone !== undefined) supplier.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== undefined) supplier.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.address !== undefined) supplier.address = data.address ? data.address.trim() : null;
    if (data.gstin !== undefined) supplier.gstin = data.gstin ? data.gstin.trim() : null;
    if (data.supplierType !== undefined) supplier.supplierType = data.supplierType;
    if (data.erpnextSupplierId !== undefined) supplier.erpnextSupplierId = data.erpnextSupplierId;
    if (data.isActive !== undefined) supplier.isActive = data.isActive;

    await supplier.save();
    return supplier;
  }

  public static async setErpnextId(id: number, erpnextSupplierId: string): Promise<Supplier> {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }
    supplier.erpnextSupplierId = erpnextSupplierId;
    await supplier.save();
    return supplier;
  }

  public static async deleteSupplier(id: number): Promise<boolean> {
    const supplier = await Supplier.findByPk(id);
    if (!supplier) {
      const error = new Error(`Supplier with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await supplier.destroy();
    return true;
  }
}

