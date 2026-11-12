import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProductAttributes {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  brand?: string | null;
  size?: string | null;
  colour?: string | null;
  fabricType?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  erpnextItemCode?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductCreationAttributes = Optional<
  ProductAttributes,
  | 'id'
  | 'brand'
  | 'size'
  | 'colour'
  | 'fabricType'
  | 'purchasePrice'
  | 'sellingPrice'
  | 'gstRate'
  | 'stockQuantity'
  | 'reorderLevel'
  | 'isActive'
  | 'erpnextItemCode'
>;

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  declare public id: number;
  declare public name: string;
  declare public sku: string;
  declare public categoryId: number;
  declare public brand: string | null;
  declare public size: string | null;
  declare public colour: string | null;
  declare public fabricType: string | null;
  declare public purchasePrice: number;
  declare public sellingPrice: number;
  declare public gstRate: number;
  declare public stockQuantity: number;
  declare public reorderLevel: number;
  declare public isActive: boolean;
  declare public erpnextItemCode: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    colour: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fabricType: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'fabric_type',
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'purchase_price',
      get() {
        const val = this.getDataValue('purchasePrice');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    sellingPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'selling_price',
      get() {
        const val = this.getDataValue('sellingPrice');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    gstRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 5.0,
      field: 'gst_rate',
      get() {
        const val = this.getDataValue('gstRate');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    stockQuantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'stock_quantity',
      get() {
        const val = this.getDataValue('stockQuantity');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'reorder_level',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    erpnextItemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_item_code',
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    underscored: true,
  }
);
