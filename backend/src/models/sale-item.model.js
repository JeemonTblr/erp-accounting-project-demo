const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class SaleItem extends Model {
}
SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "sale_id",
      references: {
        model: "sales",
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
    tableName: "sale_items",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  SaleItem,
};
