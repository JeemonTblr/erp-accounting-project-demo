import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SaleItemAttributes {
  id: number;
  saleId: number;
  productId: number;
  variantId?: number | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SaleItemCreationAttributes = Optional<
  SaleItemAttributes,
  'id' | 'variantId' | 'discountAmount' | 'taxRate' | 'taxAmount'
>;

export class SaleItem extends Model<SaleItemAttributes, SaleItemCreationAttributes> implements SaleItemAttributes {
  declare public id: number;
  declare public saleId: number;
  declare public productId: number;
  declare public variantId: number | null;
  declare public itemName: string;
  declare public sku: string;
  declare public quantity: number;
  declare public unitPrice: number;
  declare public discountAmount: number;
  declare public taxRate: number;
  declare public taxAmount: number;
  declare public totalAmount: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

SaleItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    saleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sale_id',
      references: {
        model: 'sales',
        key: 'id',
      },
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
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'variant_id',
      references: {
        model: 'product_variants',
        key: 'id',
      },
    },
    itemName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: 'item_name',
    },
    sku: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 1.0,
      get() {
        const val = this.getDataValue('quantity');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'unit_price',
      get() {
        const val = this.getDataValue('unitPrice');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'discount_amount',
      get() {
        const val = this.getDataValue('discountAmount');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'tax_rate',
      get() {
        const val = this.getDataValue('taxRate');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'tax_amount',
      get() {
        const val = this.getDataValue('taxAmount');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'total_amount',
      get() {
        const val = this.getDataValue('totalAmount');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
  },
  {
    sequelize,
    tableName: 'sale_items',
    timestamps: true,
    underscored: true,
  }
);
