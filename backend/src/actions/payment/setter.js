const { Payment } = require("../../models/payment.model");
const { Sale } = require("../../models/sale.model");
const { Purchase } = require("../../models/purchase.model");
const { sequelize } = require("../../config/database");
class PaymentSetter {
  static generatePaymentNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `PAY-${(/* @__PURE__ */ new Date()).getFullYear()}-${timestamp}${random}`;
  }
  static async createPayment(data) {
    const transaction = await sequelize.transaction();
    try {
      const paymentNumber = this.generatePaymentNumber();
      const amount = Number(data.amount);
      const payment = await Payment.create(
        {
          paymentNumber,
          paymentType: data.paymentType,
          referenceType: data.referenceType || "DIRECT",
          referenceId: data.referenceId || null,
          partyType: data.partyType,
          partyId: data.partyId,
          amount,
          paymentMethod: data.paymentMethod,
          paymentDate: data.paymentDate || /* @__PURE__ */ new Date(),
          transactionReference: data.transactionReference || null,
          status: "COMPLETED",
          notes: data.notes || null
        },
        { transaction }
      );
      if (data.referenceType === "SALE" && data.referenceId) {
        const sale = await Sale.findByPk(data.referenceId, { transaction });
        if (sale) {
          const newPaid = Number(sale.paidAmount) + amount;
          sale.paidAmount = newPaid;
          sale.paymentStatus = newPaid >= Number(sale.grandTotal) ? "PAID" : "PARTIAL";
          await sale.save({ transaction });
        }
      }
      if (data.referenceType === "PURCHASE" && data.referenceId) {
        const purchase = await Purchase.findByPk(data.referenceId, { transaction });
        if (purchase) {
          const newPaid = Number(purchase.paidAmount) + amount;
          purchase.paidAmount = newPaid;
          purchase.paymentStatus = newPaid >= Number(purchase.grandTotal) ? "PAID" : "PARTIAL";
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
  static async setErpnextPaymentEntryId(id, erpnextPaymentEntryId) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error(`Payment with ID ${id} not found.`);
    payment.erpnextPaymentEntryId = erpnextPaymentEntryId;
    await payment.save();
    return payment;
  }
  static async deletePayment(id) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new Error(`Payment with ID ${id} not found.`);
    await payment.destroy();
    return true;
  }
}
module.exports = {
  PaymentSetter,
};
