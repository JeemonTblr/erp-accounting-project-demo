const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class ProductVariant extends Model {
}
ProductVariant.init(
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
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    colour: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    additionalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "additional_price",
      get() {
        const val = this.getDataValue("additionalPrice");
        return val === null ? 0 : parseFloat(val);
      }
    },
    stockQuantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "stock_quantity",
      get() {
        const val = this.getDataValue("stockQuantity");
        return val === null ? 0 : parseFloat(val);
      }
    },
    erpnextItemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_item_code"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    tableName: "product_variants",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  ProductVariant,
};
