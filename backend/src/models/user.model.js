const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class User extends Model {
}
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM("ADMIN", "MANAGER", "CASHIER", "STAFF"),
      defaultValue: "ADMIN",
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    tableName: "users",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  User,
};
