import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface InventoryTransactionAttributes {
  id: number;
  productId: number;
  variantId?: number | null;
  transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  quantity: number;
  referenceType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'INITIAL_STOCK';
  referenceId?: number | null;
  notes?: string | null;
  erpnextStockEntryId?: string | null;
  transactionDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InventoryTransactionCreationAttributes = Optional<
  InventoryTransactionAttributes,
  'id' | 'variantId' | 'referenceId' | 'notes' | 'erpnextStockEntryId' | 'transactionDate'
>;

export class InventoryTransaction
  extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes>
  implements InventoryTransactionAttributes {
  declare public id: number;
  declare public productId: number;
  declare public variantId: number | null;
  declare public transactionType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';
  declare public quantity: number;
  declare public referenceType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'INITIAL_STOCK';
  declare public referenceId: number | null;
  declare public notes: string | null;
  declare public erpnextStockEntryId: string | null;
  declare public transactionDate: Date;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

InventoryTransaction.init(
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
    variantId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'variant_id',
      references: {
        model: 'product_variants',
        key: 'id',
      },
    },
    transactionType: {
      type: DataTypes.ENUM('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN'),
      allowNull: false,
      field: 'transaction_type',
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const val = this.getDataValue('quantity');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    referenceType: {
      type: DataTypes.ENUM('SALE', 'PURCHASE', 'ADJUSTMENT', 'INITIAL_STOCK'),
      allowNull: false,
      defaultValue: 'INITIAL_STOCK',
      field: 'reference_type',
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    erpnextStockEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_stock_entry_id',
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'transaction_date',
    },
  },
  {
    sequelize,
    tableName: 'inventory_transactions',
    timestamps: true,
    underscored: true,
  }
);