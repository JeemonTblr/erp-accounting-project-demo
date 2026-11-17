const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Product extends Model {
}
Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "category_id",
      references: {
        model: "categories",
        key: "id"
      }
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    colour: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fabricType: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: "fabric_type"
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "purchase_price",
      get() {
        const val = this.getDataValue("purchasePrice");
        return val === null ? 0 : parseFloat(val);
      }
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "selling_price",
      get() {
        const val = this.getDataValue("sellingPrice");
        return val === null ? 0 : parseFloat(val);
      }
    },
    gstRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5,
      field: "gst_rate",
      get() {
        const val = this.getDataValue("gstRate");
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
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: "reorder_level"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active"
    },
    erpnextItemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_item_code"
    }
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Product,
};
