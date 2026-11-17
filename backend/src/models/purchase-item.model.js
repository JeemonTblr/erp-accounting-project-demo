const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class PurchaseItem extends Model {
}
PurchaseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "purchase_id",
      references: {
        model: "purchases",
        key: "id"
      }
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
    itemName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "item_name"
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 1,
      get() {
        const val = this.getDataValue("quantity");
        return val === null ? 0 : parseFloat(val);
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "unit_price",
      get() {
        const val = this.getDataValue("unitPrice");
        return val === null ? 0 : parseFloat(val);
      }
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      field: "tax_rate",
      get() {
        const val = this.getDataValue("taxRate");
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
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_amount",
      get() {
        const val = this.getDataValue("totalAmount");
        return val === null ? 0 : parseFloat(val);
      }
    }
  },
  {
    sequelize,
    tableName: "purchase_items",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  PurchaseItem,
};
