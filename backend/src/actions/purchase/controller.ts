import { Request, Response, NextFunction } from 'express';
import { PurchaseSetter } from './setter';
import { PurchaseGetter } from './getter';
import { Supplier } from '../../models/supplier.model';
import { Product } from '../../models/product.model';
import { PaymentSetter } from '../payment/setter';
import { ErpPurchaseInvoiceService } from '../../helpers/erpnext/purchase-invoice.service';
import { ErpPaymentEntryService } from '../../helpers/erpnext/payment-entry.service';
import { ErpSupplierService } from '../../helpers/erpnext/supplier.service';
import { ErpItemService } from '../../helpers/erpnext/item.service';
import { ErpSyncSetter } from '../erp-sync/setter';

export class PurchaseController {
  /**
   * Helper: Resolves ERPNext Supplier name (syncs to ERPNext if needed).
   */
  private static async resolveErpSupplier(supplierId: number): Promise<string> {
    const supplier = await Supplier.findByPk(supplierId);
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }
    if (supplier.erpnextSupplierId) {
      return supplier.erpnextSupplierId;
    }
    const syncedName = await ErpSupplierService.sync({
      name: supplier.name,
      supplierType: supplier.supplierType,
      phone: supplier.phone,
      email: supplier.email,
      gstin: supplier.gstin,
    });
    supplier.erpnextSupplierId = syncedName;
    await supplier.save();
    return syncedName;
  }

  /**
   * Record a Stock Purchase: saves in MariaDB + syncs Purchase Invoice and Supplier Payment to ERPNext.
   */
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { supplierId, paymentStatus, paidAmount, paymentMethod, notes, items } = req.body;

      if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Supplier ID and at least one purchase item are required.',
        });
        return;
      }

      // 1. Create locally in MariaDB (increments stock in products and records STOCK_IN inventory transaction)
      const purchase = await PurchaseSetter.createPurchase({
        supplierId,
        paymentStatus,
        paidAmount,
        notes,
        items,
      });

      const fullPurchase = await PurchaseGetter.fetchById(purchase.id);
      if (!fullPurchase) {
        throw new Error(`Failed to retrieve newly created purchase ID ${purchase.id}`);
      }

      // 2. ERPNext Purchase Invoice Sync
      let erpInvoiceName: string | null = null;
      let erpPaymentName: string | null = null;
      let erpInvoiceError: string | null = null;
      let erpPaymentError: string | null = null;

      const invoiceSyncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(purchase.id),
        transactionType: 'PURCHASE_INVOICE_SYNC',
        erpnextDocumentType: 'Purchase Invoice',
        syncStatus: 'PROCESSING',
      });

      try {
        const erpSupplierName = await PurchaseController.resolveErpSupplier(purchase.supplierId);

        // Prepare ERPNext purchase invoice items
        const invoiceItems: Array<{ itemCode: string; qty: number; rate: number; description?: string }> = [];
        for (const item of (fullPurchase.items || [])) {
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

        // Create & Submit Purchase Invoice in ERPNext
        const invoiceResult = await ErpPurchaseInvoiceService.createAndSubmitPurchaseInvoice({
          supplierName: erpSupplierName,
          items: invoiceItems,
          remarks: `Stock Purchase #${purchase.purchaseNumber}`,
        });

        erpInvoiceName = invoiceResult.invoiceName;
        purchase.erpnextPurchaseInvoiceId = erpInvoiceName;
        await purchase.save();
        await ErpSyncSetter.markSynced(invoiceSyncLog.id, erpInvoiceName);

        // 3. ERPNext Supplier Payment Entry Sync (if paid)
        if (Number(purchase.paidAmount) > 0) {
          const paymentSyncLog = await ErpSyncSetter.createLog({
            localTransactionId: String(purchase.id),
            transactionType: 'SUPPLIER_PAYMENT_SYNC',
            erpnextDocumentType: 'Payment Entry',
            syncStatus: 'PROCESSING',
          });

          try {
            // Save local Payment record in MariaDB
            const localPayment = await PaymentSetter.createPayment({
              paymentType: 'SUPPLIER_PAYMENT',
              referenceType: 'PURCHASE',
              referenceId: purchase.id,
              partyType: 'SUPPLIER',
              partyId: purchase.supplierId,
              amount: Number(purchase.paidAmount),
              paymentMethod: (paymentMethod || 'BANK') as 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD',
              transactionReference: purchase.purchaseNumber,
              notes: `Payment for Purchase #${purchase.purchaseNumber}`,
            });

            // Create & Submit Supplier Payment Entry in ERPNext
            const paymentResult = await ErpPaymentEntryService.createAndSubmitSupplierPayment({
              supplierName: erpSupplierName,
              amount: Number(purchase.paidAmount),
              paymentMethod: paymentMethod || 'WIRE_TRANSFER',
              invoiceName: erpInvoiceName,
              referenceNumber: purchase.purchaseNumber,
              remarks: `Payment for Purchase Invoice ${purchase.purchaseNumber}`,
            });

            erpPaymentName = paymentResult.paymentName;
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

      const refreshed = await PurchaseGetter.fetchById(purchase.id);
      res.status(201).json({
        success: true,
        message: 'Stock purchase recorded successfully.',
        data: refreshed,
        erpSync: {
          invoice: {
            status: erpInvoiceName ? 'SYNCED' : 'FAILED',
            erpnextPurchaseInvoiceId: erpInvoiceName,
            error: erpInvoiceError,
          },
          payment: {
            status: erpPaymentName ? 'SYNCED' : Number(purchase.paidAmount) > 0 ? (erpPaymentError ? 'FAILED' : 'SKIPPED') : 'SKIPPED',
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
   * Manual / Retry ERPNext Sync for a specific Purchase.
   */
  public static async syncToErp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid purchase ID' });
        return;
      }

      const purchase = await PurchaseGetter.fetchById(id);
      if (!purchase) {
        res.status(404).json({ success: false, message: `Purchase ${id} not found` });
        return;
      }

      const erpSupplierName = await PurchaseController.resolveErpSupplier(purchase.supplierId);

      // 1. Sync Purchase Invoice if missing
      if (!purchase.erpnextPurchaseInvoiceId) {
        const invoiceItems: Array<{ itemCode: string; qty: number; rate: number; description?: string }> = [];
        for (const item of (purchase.items || [])) {
          const itemCode = (item as unknown as { product?: { erpnextItemCode?: string } }).product?.erpnextItemCode || item.sku;
          invoiceItems.push({
            itemCode,
            qty: Number(item.quantity),
            rate: Number(item.unitPrice),
            description: item.itemName,
          });
        }

        const invoiceResult = await ErpPurchaseInvoiceService.createAndSubmitPurchaseInvoice({
          supplierName: erpSupplierName,
          items: invoiceItems,
          remarks: `Stock Purchase #${purchase.purchaseNumber}`,
        });

        purchase.erpnextPurchaseInvoiceId = invoiceResult.invoiceName;
        await purchase.save();
      }

      // 2. Sync Payment if missing and paidAmount > 0
      if (Number(purchase.paidAmount) > 0 && purchase.erpnextPurchaseInvoiceId) {
        const paymentResult = await ErpPaymentEntryService.createAndSubmitSupplierPayment({
          supplierName: erpSupplierName,
          amount: Number(purchase.paidAmount),
          invoiceName: purchase.erpnextPurchaseInvoiceId,
          referenceNumber: purchase.purchaseNumber,
          remarks: `Payment for Purchase Invoice ${purchase.purchaseNumber}`,
        });

        purchase.erpnextReceiptId = paymentResult.paymentName;
        await purchase.save();
      }

      const refreshed = await PurchaseGetter.fetchById(purchase.id);
      res.status(200).json({
        success: true,
        message: 'Purchase successfully synced to ERPNext.',
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
        res.status(400).json({ success: false, message: 'Invalid purchase ID' });
        return;
      }

      await PurchaseSetter.deletePurchase(id);
      res.status(200).json({
        success: true,
        message: `Purchase with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
