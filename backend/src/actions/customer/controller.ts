import { Request, Response, NextFunction } from 'express';
import { CustomerSetter } from './setter';
import { Customer } from '../../models/customer.model';
import { ErpCustomerService } from '../../helpers/erpnext/customer.service';
import { ErpSyncSetter } from '../erp-sync/setter';

export class CustomerController {
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, phone, email, address, gstin, customerType } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Customer name is required.' });
        return;
      }

      // 1. Create locally in MariaDB
      const customer = await CustomerSetter.createCustomer({
        name,
        phone,
        email,
        address,
        gstin,
        customerType,
      });

      // 2. Initialize sync log
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(customer.id),
        transactionType: 'CUSTOMER_SYNC',
        erpnextDocumentType: 'Customer',
        syncStatus: 'PROCESSING',
        payload: JSON.stringify({ name: customer.name, phone: customer.phone, email: customer.email, gstin: customer.gstin }),
      });

      // 3. Attempt sync with ERPNext
      let erpSyncStatus = 'SYNCED';
      let erpSyncError: string | null = null;
      try {
        const erpDocName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          gstin: customer.gstin,
        });

        // Update local customer with ERPNext Doc Name
        await CustomerSetter.setErpnextId(customer.id, erpDocName);
        customer.erpnextCustomerId = erpDocName;

        // Mark sync log success
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);
      } catch (err: unknown) {
        erpSyncStatus = 'FAILED';
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }

      res.status(201).json({
        success: true,
        message: 'Customer created successfully.',
        data: customer,
        erpSync: {
          status: erpSyncStatus,
          error: erpSyncError,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid customer ID' });
        return;
      }

      const updated = await CustomerSetter.updateCustomer(id, req.body);

      // Attempt ERPNext sync if linked
      if (updated.erpnextCustomerId) {
        try {
          await ErpCustomerService.updateCustomer(updated.erpnextCustomerId, {
            name: updated.name,
            customerType: updated.customerType,
            phone: updated.phone,
            email: updated.email,
            gstin: updated.gstin,
          });
        } catch (err) {
          console.error(`Failed to update customer in ERPNext: ${err}`);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Customer updated successfully.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async syncToErp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid customer ID' });
        return;
      }

      const customer = await Customer.findByPk(id);
      if (!customer) {
        res.status(404).json({ success: false, message: `Customer ${id} not found` });
        return;
      }

      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(customer.id),
        transactionType: 'CUSTOMER_SYNC',
        erpnextDocumentType: 'Customer',
        syncStatus: 'PROCESSING',
      });

      try {
        const erpDocName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          gstin: customer.gstin,
          existingErpnextId: customer.erpnextCustomerId,
        });

        await CustomerSetter.setErpnextId(customer.id, erpDocName);
        customer.erpnextCustomerId = erpDocName;
        await ErpSyncSetter.markSynced(syncLog.id, erpDocName);

        res.status(200).json({
          success: true,
          message: 'Customer successfully synced to ERPNext.',
          erpnextCustomerId: erpDocName,
          data: customer,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid customer ID' });
        return;
      }

      await CustomerSetter.deleteCustomer(id);
      res.status(200).json({
        success: true,
        message: `Customer with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
