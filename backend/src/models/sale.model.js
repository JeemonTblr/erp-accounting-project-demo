const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Sale extends Model {
}
Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    invoiceNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: "invoice_number"
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "customer_id",
      references: {
        model: "customers",
        key: "id"
      }
    },
    customerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: "customer_name"
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "sale_date"
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue("subtotal");
        return val === null ? 0 : parseFloat(val);
      }
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_amount",
      get() {
        const val = this.getDataValue("discountAmount");
        return val === null ? 0 : parseFloat(val);
      }
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "tax_amount",
      get() {
        const val = this.getDataValue("taxAmount");
        return val === null ? 0 : parseFloat(val);
      }
    },
    grandTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "grand_total",
      get() {
        const val = this.getDataValue("grandTotal");
        return val === null ? 0 : parseFloat(val);
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM("CASH", "BANK", "UPI", "DEBIT_CARD", "CREDIT_CARD", "SPLIT"),
      defaultValue: "CASH",
      field: "payment_method"
    },
    paymentStatus: {
      type: DataTypes.ENUM("PAID", "PARTIAL", "UNPAID"),
      defaultValue: "UNPAID",
      field: "payment_status"
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "paid_amount",
      get() {
        const val = this.getDataValue("paidAmount");
        return val === null ? 0 : parseFloat(val);
      }
    },
    erpnextInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_invoice_id"
    },
    erpnextPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_payment_id"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "sales",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Sale,
};
