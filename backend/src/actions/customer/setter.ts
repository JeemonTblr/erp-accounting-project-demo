import { Customer } from '../../models/customer.model';

export class CustomerSetter {
  public static async createCustomer(data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    gstin?: string | null;
    customerType?: string;
    erpnextCustomerId?: string | null;
    isActive?: boolean;
  }): Promise<Customer> {
    return Customer.create({
      name: data.name.trim(),
      phone: data.phone ? data.phone.trim() : null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      address: data.address ? data.address.trim() : null,
      gstin: data.gstin ? data.gstin.trim() : null,
      customerType: data.customerType || 'Individual',
      erpnextCustomerId: data.erpnextCustomerId || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });
  }

  public static async updateCustomer(
    id: number,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      gstin?: string | null;
      customerType?: string;
      erpnextCustomerId?: string | null;
      isActive?: boolean;
    }
  ): Promise<Customer> {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) customer.name = data.name.trim();
    if (data.phone !== undefined) customer.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== undefined) customer.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.address !== undefined) customer.address = data.address ? data.address.trim() : null;
    if (data.gstin !== undefined) customer.gstin = data.gstin ? data.gstin.trim() : null;
    if (data.customerType !== undefined) customer.customerType = data.customerType;
    if (data.erpnextCustomerId !== undefined) customer.erpnextCustomerId = data.erpnextCustomerId;
    if (data.isActive !== undefined) customer.isActive = data.isActive;

    await customer.save();
    return customer;
  }

  public static async setErpnextId(id: number, erpnextCustomerId: string): Promise<Customer> {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }
    customer.erpnextCustomerId = erpnextCustomerId;
    await customer.save();
    return customer;
  }

  public static async deleteCustomer(id: number): Promise<boolean> {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await customer.destroy();
    return true;
  }
}

