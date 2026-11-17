const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Purchase extends Model {
}
Purchase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    purchaseNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: "purchase_number"
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "supplier_id",
      references: {
        model: "suppliers",
        key: "id"
      }
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "purchase_date"
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
    erpnextPurchaseInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_purchase_invoice_id"
    },
    erpnextReceiptId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_receipt_id"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "purchases",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Purchase,
};
