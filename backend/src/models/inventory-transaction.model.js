const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class InventoryTransaction extends Model {
}
InventoryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id",
      references: {
        model: "products",
        key: "id"
      }
    },
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "variant_id",
      references: {
        model: "product_variants",
        key: "id"
      }
    },
    transactionType: {
      type: DataTypes.ENUM("STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "DAMAGE", "RETURN"),
      allowNull: false,
      field: "transaction_type"
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      get() {
        const val = this.getDataValue("quantity");
        return val === null ? 0 : parseFloat(val);
      }
    },
    referenceType: {
      type: DataTypes.ENUM("SALE", "PURCHASE", "ADJUSTMENT", "INITIAL_STOCK"),
      allowNull: false,
      defaultValue: "INITIAL_STOCK",
      field: "reference_type"
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "reference_id"
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    erpnextStockEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_stock_entry_id"
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "transaction_date"
    }
  },
  {
    sequelize,
    tableName: "inventory_transactions",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  InventoryTransaction,
};
