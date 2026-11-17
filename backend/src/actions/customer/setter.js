const { Customer } = require("../../models/customer.model");
class CustomerSetter {
  static async createCustomer(data) {
    return Customer.create({
      name: data.name.trim(),
      phone: data.phone ? data.phone.trim() : null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      address: data.address ? data.address.trim() : null,
      gstin: data.gstin ? data.gstin.trim() : null,
      customerType: data.customerType || "Individual",
      erpnextCustomerId: data.erpnextCustomerId || null,
      isActive: data.isActive !== void 0 ? data.isActive : true
    });
  }
  static async updateCustomer(id, data) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (data.name !== void 0) customer.name = data.name.trim();
    if (data.phone !== void 0) customer.phone = data.phone ? data.phone.trim() : null;
    if (data.email !== void 0) customer.email = data.email ? data.email.trim().toLowerCase() : null;
    if (data.address !== void 0) customer.address = data.address ? data.address.trim() : null;
    if (data.gstin !== void 0) customer.gstin = data.gstin ? data.gstin.trim() : null;
    if (data.customerType !== void 0) customer.customerType = data.customerType;
    if (data.erpnextCustomerId !== void 0) customer.erpnextCustomerId = data.erpnextCustomerId;
    if (data.isActive !== void 0) customer.isActive = data.isActive;
    await customer.save();
    return customer;
  }
  static async setErpnextId(id, erpnextCustomerId) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    customer.erpnextCustomerId = erpnextCustomerId;
    await customer.save();
    return customer;
  }
  static async deleteCustomer(id) {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      const error = new Error(`Customer with ID ${id} not found.`);
      error.statusCode = 404;
      throw error;
    }
    await customer.destroy();
    return true;
  }
}
module.exports = {
  CustomerSetter,
};
