const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Payment extends Model {
}
Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    paymentNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: "payment_number"
    },
    paymentType: {
      type: DataTypes.ENUM("CUSTOMER_PAYMENT", "SUPPLIER_PAYMENT"),
      allowNull: false,
      field: "payment_type"
    },
    referenceType: {
      type: DataTypes.ENUM("SALE", "PURCHASE", "EXPENSE", "DIRECT"),
      allowNull: false,
      defaultValue: "DIRECT",
      field: "reference_type"
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "reference_id"
    },
    partyType: {
      type: DataTypes.ENUM("CUSTOMER", "SUPPLIER"),
      allowNull: false,
      field: "party_type"
    },
    partyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "party_id"
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue("amount");
        return val === null ? 0 : parseFloat(val);
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM("CASH", "BANK", "UPI", "DEBIT_CARD", "CREDIT_CARD"),
      allowNull: false,
      defaultValue: "CASH",
      field: "payment_method"
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "payment_date"
    },
    transactionReference: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "transaction_reference"
    },
    erpnextPaymentEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_payment_entry_id"
    },
    status: {
      type: DataTypes.ENUM("COMPLETED", "PENDING", "CANCELLED"),
      defaultValue: "COMPLETED"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Payment,
};
