import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PurchaseItemAttributes {
  id: number;
  purchaseId: number;
  productId: number;
  variantId?: number | null;
  itemName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PurchaseItemCreationAttributes = Optional<
  PurchaseItemAttributes,
  'id' | 'variantId' | 'taxRate' | 'taxAmount'
>;

export class PurchaseItem
  extends Model<PurchaseItemAttributes, PurchaseItemCreationAttributes>
  implements PurchaseItemAttributes {
  declare public id: number;
  declare public purchaseId: number;
  declare public productId: number;
  declare public variantId: number | null;
  declare public itemName: string;
  declare public sku: string;
  declare public quantity: number;
  declare public unitPrice: number;
  declare public taxRate: number;
  declare public taxAmount: number;
  declare public totalAmount: number;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

PurchaseItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'purchase_id',
      references: {
        model: 'purchases',
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
    tableName: 'purchase_items',
    timestamps: true,
    underscored: true,
  }
);