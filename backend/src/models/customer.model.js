const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Customer extends Model {
}
Customer.init(
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
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    gstin: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    customerType: {
      type: DataTypes.STRING(50),
      defaultValue: "Individual",
      field: "customer_type"
    },
    erpnextCustomerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "erpnext_customer_id"
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    tableName: "customers",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Customer,
};
