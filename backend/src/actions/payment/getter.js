const { Payment } = require("../../models/payment.model");
class PaymentGetter {
  static async fetchById(id) {
    return Payment.findByPk(id);
  }
  static async fetchAll(options) {
    const where = {};
    if (options?.partyType) where.partyType = options.partyType;
    if (options?.partyId) where.partyId = options.partyId;
    if (options?.paymentType) where.paymentType = options.paymentType;
    if (options?.paymentMethod) where.paymentMethod = options.paymentMethod;
    return Payment.findAll({
      where,
      order: [["paymentDate", "DESC"]]
    });
  }
  static async getAll(req, res, next) {
    try {
      const partyType = req.query.party_type;
      const partyId = req.query.party_id ? parseInt(req.query.party_id, 10) : void 0;
      const paymentType = req.query.payment_type;
      const paymentMethod = req.query.method;
      const payments = await PaymentGetter.fetchAll({ partyType, partyId, paymentType, paymentMethod });
      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }
  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid payment ID" });
        return;
      }
      const payment = await PaymentGetter.fetchById(id);
      if (!payment) {
        res.status(404).json({ success: false, message: `Payment with ID ${id} not found.` });
        return;
      }
      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  PaymentGetter,
};
