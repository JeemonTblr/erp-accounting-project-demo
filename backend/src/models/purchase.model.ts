import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PurchaseAttributes {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  purchaseDate: Date;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paidAmount: number;
  erpnextPurchaseInvoiceId?: string | null;
  erpnextReceiptId?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PurchaseCreationAttributes = Optional<
  PurchaseAttributes,
  'id' | 'taxAmount' | 'paymentStatus' | 'paidAmount' | 'erpnextPurchaseInvoiceId' | 'erpnextReceiptId' | 'notes'
>;

export class Purchase extends Model<PurchaseAttributes, PurchaseCreationAttributes> implements PurchaseAttributes {
  declare public id: number;
  declare public purchaseNumber: string;
  declare public supplierId: number;
  declare public purchaseDate: Date;
  declare public subtotal: number;
  declare public taxAmount: number;
  declare public grandTotal: number;
  declare public paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  declare public paidAmount: number;
  declare public erpnextPurchaseInvoiceId: string | null;
  declare public erpnextReceiptId: string | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Purchase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    purchaseNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'purchase_number',
    },
    supplierId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'supplier_id',
      references: {
        model: 'suppliers',
        key: 'id',
      },
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'purchase_date',
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const val = this.getDataValue('subtotal');
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
    grandTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'grand_total',
      get() {
        const val = this.getDataValue('grandTotal');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    paymentStatus: {
      type: DataTypes.ENUM('PAID', 'PARTIAL', 'UNPAID'),
      defaultValue: 'UNPAID',
      field: 'payment_status',
    },
    paidAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'paid_amount',
      get() {
        const val = this.getDataValue('paidAmount');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    erpnextPurchaseInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_purchase_invoice_id',
    },
    erpnextReceiptId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_receipt_id',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchases',
    timestamps: true,
    underscored: true,
  }
);
