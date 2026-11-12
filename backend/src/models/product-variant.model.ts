import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ProductVariantAttributes {
  id: number;
  productId: number;
  sku: string;
  size?: string | null;
  colour?: string | null;
  additionalPrice: number;
  stockQuantity: number;
  erpnextItemCode?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductVariantCreationAttributes = Optional<
  ProductVariantAttributes,
  'id' | 'size' | 'colour' | 'additionalPrice' | 'stockQuantity' | 'erpnextItemCode' | 'isActive'
>;

export class ProductVariant
  extends Model<ProductVariantAttributes, ProductVariantCreationAttributes>
  implements ProductVariantAttributes {
  declare public id: number;
  declare public productId: number;
  declare public sku: string;
  declare public size: string | null;
  declare public colour: string | null;
  declare public additionalPrice: number;
  declare public stockQuantity: number;
  declare public erpnextItemCode: string | null;
  declare public isActive: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

ProductVariant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id',
      },
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    colour: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    additionalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'additional_price',
      get() {
        const val = this.getDataValue('additionalPrice');
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
    erpnextItemCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_item_code',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'product_variants',
    timestamps: true,
    underscored: true,
  }
);