import { Sale } from '../../models/sale.model';
import { SaleItem } from '../../models/sale-item.model';
import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { InventoryTransaction } from '../../models/inventory-transaction.model';
import { sequelize } from '../../config/database';

export interface CreateSaleInput {
  customerId?: number | null;
  customerName?: string | null;
  paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'SPLIT';
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
  paidAmount?: number;
  discountAmount?: number;
  notes?: string | null;
  items: Array<{
    productId: number;
    variantId?: number | null;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxRate?: number;
  }>;
}

export class SaleSetter {
  public static generateInvoiceNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `INV-${new Date().getFullYear()}-${timestamp}${random}`;
  }

  public static async createSale(input: CreateSaleInput): Promise<Sale> {
    const transaction = await sequelize.transaction();

    try {
      const invoiceNumber = this.generateInvoiceNumber();

      let subtotal = 0;
      let totalTax = 0;

      const preparedItems: Array<{
        productId: number;
        variantId: number | null;
        itemName: string;
        sku: string;
        quantity: number;
        unitPrice: number;
        discountAmount: number;
        taxRate: number;
        taxAmount: number;
        totalAmount: number;
      }> = [];

      for (const item of input.items) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        let sku = product.sku;
        let itemName = product.name;

        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction });
          if (!variant) {
            throw new Error(`Variant ${item.variantId} not found.`);
          }
          sku = variant.sku;
          itemName = `${product.name} (${variant.size || ''} ${variant.colour || ''})`.trim();
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice || product.sellingPrice);
        const itemDiscount = Number(item.discountAmount || 0);
        const taxable = quantity * unitPrice - itemDiscount;
        const taxRate = Number(item.taxRate !== undefined ? item.taxRate : product.gstRate);
        const taxAmount = (taxable * taxRate) / 100;
        const totalAmount = taxable + taxAmount;

        subtotal += taxable;
        totalTax += taxAmount;

        preparedItems.push({
          productId: item.productId,
          variantId: item.variantId || null,
          itemName,
          sku,
          quantity,
          unitPrice,
          discountAmount: itemDiscount,
          taxRate,
          taxAmount,
          totalAmount,
        });

        // Deduct inventory
        product.stockQuantity = Number(product.stockQuantity) - quantity;
        await product.save({ transaction });

        if (item.variantId) {
          const variant = await ProductVariant.findByPk(item.variantId, { transaction });
          if (variant) {
            variant.stockQuantity = Number(variant.stockQuantity) - quantity;
            await variant.save({ transaction });
          }
        }
      }

      const overallDiscount = Number(input.discountAmount || 0);
      const grandTotal = Math.max(0, subtotal - overallDiscount + totalTax);
      const paidAmount =
        input.paidAmount !== undefined
          ? Number(input.paidAmount)
          : input.paymentStatus === 'PAID'
          ? grandTotal
          : 0;

      const sale = await Sale.create(
        {
          invoiceNumber,
          customerId: input.customerId || null,
          customerName: input.customerName || null,
          saleDate: new Date(),
          subtotal,
          discountAmount: overallDiscount,
          taxAmount: totalTax,
          grandTotal,
          paymentMethod: input.paymentMethod || 'CASH',
          paymentStatus: input.paymentStatus || (paidAmount >= grandTotal ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
          paidAmount,
          notes: input.notes || null,
        },
        { transaction }
      );

      // Create SaleItems and InventoryTransactions
      for (const pi of preparedItems) {
        await SaleItem.create(
          {
            saleId: sale.id,
            productId: pi.productId,
            variantId: pi.variantId,
            itemName: pi.itemName,
            sku: pi.sku,
            quantity: pi.quantity,
            unitPrice: pi.unitPrice,
            discountAmount: pi.discountAmount,
            taxRate: pi.taxRate,
            taxAmount: pi.taxAmount,
            totalAmount: pi.totalAmount,
          },
          { transaction }
        );

        await InventoryTransaction.create(
          {
            productId: pi.productId,
            variantId: pi.variantId,
            transactionType: 'STOCK_OUT',
            quantity: pi.quantity,
            referenceType: 'SALE',
            referenceId: sale.id,
            notes: `Sale invoice ${invoiceNumber}`,
            transactionDate: new Date(),
          },
          { transaction }
        );
      }

      await transaction.commit();
      return sale;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public static async setErpnextReferences(
    id: number,
    erpnextInvoiceId: string,
    erpnextPaymentId?: string | null
  ): Promise<Sale> {
    const sale = await Sale.findByPk(id);
    if (!sale) throw new Error(`Sale with ID ${id} not found.`);

    sale.erpnextInvoiceId = erpnextInvoiceId;
    if (erpnextPaymentId !== undefined) {
      sale.erpnextPaymentId = erpnextPaymentId;
    }
    await sale.save();
    return sale;
  }

  public static async deleteSale(id: number): Promise<boolean> {
    const sale = await Sale.findByPk(id);
    if (!sale) throw new Error(`Sale with ID ${id} not found.`);

    await sale.destroy();
    return true;
  }
}

