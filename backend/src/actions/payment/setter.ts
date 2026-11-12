import { Payment } from '../../models/payment.model';
import { Sale } from '../../models/sale.model';
import { Purchase } from '../../models/purchase.model';
import { sequelize } from '../../config/database';

export interface CreatePaymentInput {
  paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
  referenceType?: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'DIRECT';
  referenceId?: number | null;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: number;
  amount: number;
  paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
  paymentDate?: Date;
  transactionReference?: string | null;
  notes?: string | null;
}

export class PaymentSetter {
  public static generatePaymentNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `PAY-${new Date().getFullYear()}-${timestamp}${random}`;
  }

  public static async createPayment(data: CreatePaymentInput): Promise<Payment> {
    const transaction = await sequelize.transaction();

    try {
      const paymentNumber = this.generatePaymentNumber();
      const amount = Number(data.amount);

      const payment = await Payment.create(
        {
          paymentNumber,
          paymentType: data.paymentType,
          referenceType: data.referenceType || 'DIRECT',
          referenceId: data.referenceId || null,
          partyType: data.partyType,
          partyId: data.partyId,
          amount,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate || new Date(),
          transactionReference: data.transactionReference || null,
          status: 'COMPLETED',
          notes: data.notes || null,
        },
        { transaction }
      );

      // If paying against a Sale invoice, update Sale paid amount & status
      if (data.referenceType === 'SALE' && data.referenceId) {
        const sale = await Sale.findByPk(data.referenceId, { transaction });
        if (sale) {
          const newPaid = Number(sale.paidAmount) + amount;
          sale.paidAmount = newPaid;
          sale.paymentStatus = newPaid >= Number(sale.grandTotal) ? 'PAID' : 'PARTIAL';
          await sale.save({ transaction });
        }
      }

      // If paying against a Purchase invoice, update Purchase paid amount & status
      if (data.referenceType === 'PURCHASE' && data.referenceId) {
        const purchase = await Purchase.findByPk(data.referenceId, { transaction });
        if (purchase) {
          const newPaid = Number(purchase.paidAmount) + amount;
          purchase.paidAmount = newPaid;
          purchase.paymentStatus = newPaid >= Number(purchase.grandTotal) ? 'PAID' : 'PARTIAL';
          await purchase.save({ transaction });
        }
      }

      await transaction.commit();
      return payment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public static async setErpnextPaymentEntryId(id: number, erpnextPaymentEntryId: string): Promise<Payment> {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error(`Payment with ID ${id} not found.`);

    payment.erpnextPaymentEntryId = erpnextPaymentEntryId;
    await payment.save();
    return payment;
  }

  public static async deletePayment(id: number): Promise<boolean> {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error(`Payment with ID ${id} not found.`);

    await payment.destroy();
    return true;
  }
}

