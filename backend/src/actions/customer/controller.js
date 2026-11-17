const { CustomerSetter } = require("./setter");
const { Customer } = require("../../models/customer.model");
const { ErpCustomerService } = require("../../helpers/erpnext/customer.service");
const { ErpSyncSetter } = require("../erp-sync/setter");
class CustomerController {
  static async add(req, res, next) {
    try {
      const { name, phone, email, address, gstin, customerType } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: "Customer name is required." });
        return;
      }
      const customer = await CustomerSetter.createCustomer({
        name,
        phone,
        email,
        address,
        gstin,
        customerType
      });
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(customer.id),
        transactionType: "CUSTOMER_SYNC",
        erpnextDocumentType: "Customer",
        syncStatus: "PROCESSING",
        payload: JSON.stringify({ name: customer.name, phone: customer.phone, email: customer.email, gstin: customer.gstin })
      });
      let erpSyncStatus = "SYNCED";
      let erpSyncError = null;
      try {
        const erpDocName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          gstin: customer.gstin
        });
        await CustomerSetter.setErpnextId(customer.id, erpDocName);
        customer.erpnextCustomerId = erpDocName;
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);
      } catch (err) {
        erpSyncStatus = "FAILED";
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }
      res.status(201).json({
        success: true,
        message: "Customer created successfully.",
        data: customer,
        erpSync: {
          status: erpSyncStatus,
          error: erpSyncError
        }
      });
    } catch (error) {
      next(error);
    }
  }
  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid customer ID" });
        return;
      }
      const updated = await CustomerSetter.updateCustomer(id, req.body);
      if (updated.erpnextCustomerId) {
        try {
          await ErpCustomerService.updateCustomer(updated.erpnextCustomerId, {
            name: updated.name,
            customerType: updated.customerType,
            phone: updated.phone,
            email: updated.email,
            gstin: updated.gstin
          });
        } catch (err) {
          console.error(`Failed to update customer in ERPNext: ${err}`);
        }
      }
      res.status(200).json({
        success: true,
        message: "Customer updated successfully.",
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
  static async syncToErp(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid customer ID" });
        return;
      }
      const customer = await Customer.findByPk(id);
      if (!customer) {
        res.status(404).json({ success: false, message: `Customer ${id} not found` });
        return;
      }
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(customer.id),
        transactionType: "CUSTOMER_SYNC",
        erpnextDocumentType: "Customer",
        syncStatus: "PROCESSING"
      });
      try {
        const erpDocName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          gstin: customer.gstin,
          existingErpnextId: customer.erpnextCustomerId
        });
        await CustomerSetter.setErpnextId(customer.id, erpDocName);
        customer.erpnextCustomerId = erpDocName;
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);
        res.status(200).json({
          success: true,
          message: "Customer successfully synced to ERPNext.",
          erpnextCustomerId: erpDocName,
          data: customer
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`
        });
      }
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid customer ID" });
        return;
      }
      await CustomerSetter.deleteCustomer(id);
      res.status(200).json({
        success: true,
        message: `Customer with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  CustomerController,
};
