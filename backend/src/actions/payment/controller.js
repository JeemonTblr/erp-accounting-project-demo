const { PaymentSetter } = require("./setter");
class PaymentController {
  static async add(req, res, next) {
    try {
      const {
        paymentType,
        referenceType,
        referenceId,
        partyType,
        partyId,
        amount,
        paymentMethod,
        paymentDate,
        transactionReference,
        notes
      } = req.body;
      if (!paymentType || !partyType || !partyId || !amount || !paymentMethod) {
        res.status(400).json({
          success: false,
          message: "paymentType, partyType, partyId, amount, and paymentMethod are required."
        });
        return;
      }
      const payment = await PaymentSetter.createPayment({
        paymentType,
        referenceType,
        referenceId,
        partyType,
        partyId,
        amount,
        paymentMethod,
        paymentDate,
        transactionReference,
        notes
      });
      res.status(201).json({
        success: true,
        message: "Payment recorded successfully.",
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid payment ID" });
        return;
      }
      await PaymentSetter.deletePayment(id);
      res.status(200).json({
        success: true,
        message: `Payment with ID ${id} deleted successfully.`
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = {
  PaymentController,
};
