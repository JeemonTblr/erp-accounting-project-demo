const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Expense extends Model {
}
Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    expenseNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: "expense_number"
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
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
    expenseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "expense_date"
    },
    paymentMethod: {
      type: DataTypes.ENUM("CASH", "BANK", "UPI", "DEBIT_CARD", "CREDIT_CARD"),
      defaultValue: "CASH",
      field: "payment_method"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "reference_number"
    },
    erpnextJournalEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_journal_entry_id"
    },
    erpnextPurchaseInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_purchase_invoice_id"
    }
  },
  {
    sequelize,
    tableName: "expenses",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Expense,
};
