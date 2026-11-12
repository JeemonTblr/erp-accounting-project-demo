import { Request, Response, NextFunction } from 'express';
import { SaleSetter } from './setter';
import { SaleGetter } from './getter';
import { Sale } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';
import { Payment } from '../../models/payment.model';
import { PaymentSetter } from '../payment/setter';
import { ErpSalesInvoiceService } from '../../helpers/erpnext/sales-invoice.service';
import { ErpPaymentEntryService } from '../../helpers/erpnext/payment-entry.service';
import { ErpCustomerService } from '../../helpers/erpnext/customer.service';
import { ErpItemService } from '../../helpers/erpnext/item.service';
import { ErpSyncSetter } from '../erp-sync/setter';

export class SaleController {
  /**
   * Helper: Resolves ERPNext Customer name (syncs to ERPNext if needed).
   */
  private static async resolveErpCustomer(customerId?: number | null, fallbackName?: string | null): Promise<string> {
    if (customerId) {
      const customer = await Customer.findByPk(customerId);
      if (customer) {
        if (customer.erpnextCustomerId) {
          return customer.erpnextCustomerId;
        }
        const syncedName = await ErpCustomerService.sync({
          name: customer.name,
          customerType: customer.customerType,
          phone: customer.phone,
          email: customer.email,
          gstin: customer.gstin,
        });
        customer.erpnextCustomerId = syncedName;
        await customer.save();
        return syncedName;
      }
    }
    return fallbackName || 'John Doe';
  }

  /**
   * Create a new Sale: saves in MariaDB + syncs Sales Invoice and Payment Entry to ERPNext.
   */
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, customerName, paymentMethod, paymentStatus, paidAmount, discountAmount, notes, items } =
        req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Sale must contain at least one item.',
        });
        return;
      }

      // 1. Create sale locally in MariaDB (handles inventory deduction & transactions)
      const sale = await SaleSetter.createSale({
        customerId,
        customerName,
        paymentMethod,
        paymentStatus,
        paidAmount,
        discountAmount,
        notes,
        items,
      });

      // Fetch complete sale with item details
      const fullSale = await SaleGetter.fetchById(sale.id);
      if (!fullSale) {
        throw new Error(`Failed to retrieve newly created sale ID ${sale.id}`);
      }

      // 2. ERPNext Sales Invoice Sync
      let erpInvoiceName: string | null = null;
      let erpPaymentName: string | null = null;
      let erpInvoiceError: string | null = null;
      let erpPaymentError: string | null = null;

      const invoiceSyncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(sale.id),
        transactionType: 'SALES_INVOICE_SYNC',
        erpnextDocumentType: 'Sales Invoice',
        syncStatus: 'PROCESSING',
      });

      try {
        const erpCustomerName = await SaleController.resolveErpCustomer(sale.customerId, sale.customerName);

        // Prepare ERPNext invoice items (ensure items have erpnextItemCode)
        const invoiceItems: Array<{ itemCode: string; qty: number; rate: number; description?: string }> = [];
        for (const item of (fullSale.items || [])) {
          let itemCode = item.sku;
          const product = await Product.findByPk(item.productId);
          if (product) {
            if (product.erpnextItemCode) {
              itemCode = product.erpnextItemCode;
            } else {
              itemCode = await ErpItemService.sync({
                sku: product.sku,
                name: product.name,
                sellingPrice: product.sellingPrice,
                purchasePrice: product.purchasePrice,
                stockQuantity: product.stockQuantity,
              });
              product.erpnextItemCode = itemCode;
              await product.save();
            }
          }
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName,
          });
        }

        // Create & Submit Sales Invoice in ERPNext
        const invoiceResult = await ErpSalesInvoiceService.createAndSubmitInvoice({
          customerName: erpCustomerName,
          items: invoiceItems,
          remarks: `Sale Invoice #${sale.invoiceNumber}`,
        });

        erpInvoiceName = invoiceResult.invoiceName;
        sale.erpnextInvoiceId = erpInvoiceName;
        await sale.save();
        await ErpSyncSetter.markSynced(invoiceSyncLog.id, erpInvoiceName);

        // 3. ERPNext Payment Entry Sync (if payment received)
        if (Number(sale.paidAmount) > 0) {
          const paymentSyncLog = await ErpSyncSetter.createLog({
            localTransactionId: String(sale.id),
            transactionType: 'PAYMENT_ENTRY_SYNC',
            erpnextDocumentType: 'Payment Entry',
            syncStatus: 'PROCESSING',
          });

          try {
            // Save local Payment record in MariaDB
            const localPayment = await PaymentSetter.createPayment({
              paymentType: 'CUSTOMER_PAYMENT',
              referenceType: 'SALE',
              referenceId: sale.id,
              partyType: 'CUSTOMER',
              partyId: sale.customerId || 1,
              amount: Number(sale.paidAmount),
              paymentMethod: sale.paymentMethod as 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD',
              transactionReference: sale.invoiceNumber,
              notes: `Payment for Sale #${sale.invoiceNumber}`,
            });

            // Create & Submit Payment Entry in ERPNext against the submitted Sales Invoice
            const paymentResult = await ErpPaymentEntryService.createAndSubmitCustomerPayment({
              customerName: erpCustomerName,
              amount: Number(sale.paidAmount),
              paymentMethod: sale.paymentMethod,
              invoiceName: erpInvoiceName,
              referenceNumber: sale.invoiceNumber,
              remarks: `Payment for Sale Invoice ${sale.invoiceNumber}`,
            });

            erpPaymentName = paymentResult.paymentName;
            sale.erpnextPaymentId = erpPaymentName;
            await sale.save();

            localPayment.erpnextPaymentEntryId = erpPaymentName;
            await localPayment.save();

            await ErpSyncSetter.markSynced(paymentSyncLog.id, erpPaymentName);
          } catch (payErr: unknown) {
            erpPaymentError = payErr instanceof Error ? payErr.message : String(payErr);
            await ErpSyncSetter.markFailed(paymentSyncLog.id, erpPaymentError);
          }
        }
      } catch (invErr: unknown) {
        erpInvoiceError = invErr instanceof Error ? invErr.message : String(invErr);
        await ErpSyncSetter.markFailed(invoiceSyncLog.id, erpInvoiceError);
      }

      const refreshedSale = await SaleGetter.fetchById(sale.id);
      res.status(201).json({
        success: true,
        message: 'Sale transaction recorded successfully.',
        data: refreshedSale,
        erpSync: {
          invoice: {
            status: erpInvoiceName ? 'SYNCED' : 'FAILED',
            erpnextInvoiceId: erpInvoiceName,
            error: erpInvoiceError,
          },
          payment: {
            status: erpPaymentName ? 'SYNCED' : Number(sale.paidAmount) > 0 ? (erpPaymentError ? 'FAILED' : 'SKIPPED') : 'SKIPPED',
            erpnextPaymentId: erpPaymentName,
            error: erpPaymentError,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual / Retry ERPNext Sync for a specific Sale.
   */
  public static async syncToErp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid sale ID' });
        return;
      }

      const sale = await SaleGetter.fetchById(id);
      if (!sale) {
        res.status(404).json({ success: false, message: `Sale ${id} not found` });
        return;
      }

      const erpCustomerName = await SaleController.resolveErpCustomer(sale.customerId, sale.customerName);

      // 1. Sync Invoice if missing
      if (!sale.erpnextInvoiceId) {
        const invoiceItems: Array<{ itemCode: string; qty: number; rate: number; description?: string }> = [];
        for (const item of (sale.items || [])) {
          const itemCode = (item as unknown as { product?: { erpnextItemCode?: string } }).product?.erpnextItemCode || item.sku;
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName,
          });
        }

        const invoiceResult = await ErpSalesInvoiceService.createAndSubmitInvoice({
          customerName: erpCustomerName,
          items: invoiceItems,
          remarks: `Sale Invoice #${sale.invoiceNumber}`,
        });

        sale.erpnextInvoiceId = invoiceResult.invoiceName;
        await sale.save();
      }

      // 2. Sync Payment if missing and paidAmount > 0
      if (!sale.erpnextPaymentId && Number(sale.paidAmount) > 0 && sale.erpnextInvoiceId) {
        const paymentResult = await ErpPaymentEntryService.createAndSubmitCustomerPayment({
          customerName: erpCustomerName,
          amount: Number(sale.paidAmount),
          paymentMethod: sale.paymentMethod,
          invoiceName: sale.erpnextInvoiceId,
          referenceNumber: sale.invoiceNumber,
          remarks: `Payment for Sale Invoice ${sale.invoiceNumber}`,
        });

        sale.erpnextPaymentId = paymentResult.paymentName;
        await sale.save();
      }

      const refreshed = await SaleGetter.fetchById(sale.id);
      res.status(200).json({
        success: true,
        message: 'Sale successfully synced to ERPNext.',
        data: refreshed,
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      res.status(502).json({
        success: false,
        message: `ERPNext sync failed: ${errorMsg}`,
      });
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid sale ID' });
        return;
      }

      await SaleSetter.deleteSale(id);
      res.status(200).json({
        success: true,
        message: `Sale with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
