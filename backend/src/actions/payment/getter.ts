import { Request, Response, NextFunction } from 'express';
import { Payment } from '../../models/payment.model';

export class PaymentGetter {
  public static async fetchById(id: number): Promise<Payment | null> {
    return Payment.findByPk(id);
  }

  public static async fetchAll(options?: {
    partyType?: 'CUSTOMER' | 'SUPPLIER';
    partyId?: number;
    paymentType?: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
    paymentMethod?: string;
  }): Promise<Payment[]> {
    const where: Record<string, unknown> = {};

    if (options?.partyType) where.partyType = options.partyType;
    if (options?.partyId) where.partyId = options.partyId;
    if (options?.paymentType) where.paymentType = options.paymentType;
    if (options?.paymentMethod) where.paymentMethod = options.paymentMethod;

    return Payment.findAll({
      where,
      order: [['paymentDate', 'DESC']],
    });
  }

  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partyType = req.query.party_type as 'CUSTOMER' | 'SUPPLIER' | undefined;
      const partyId = req.query.party_id ? parseInt(req.query.party_id as string, 10) : undefined;
      const paymentType = req.query.payment_type as 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT' | undefined;
      const paymentMethod = req.query.method as string | undefined;

      const payments = await PaymentGetter.fetchAll({ partyType, partyId, paymentType, paymentMethod });
      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid payment ID' });
        return;
      }

      const payment = await PaymentGetter.fetchById(id);
      if (!payment) {
        res.status(404).json({ success: false, message: `Payment with ID ${id} not found.` });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }
}

