const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class Category extends Model {
}
Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active"
    }
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  Category,
};
