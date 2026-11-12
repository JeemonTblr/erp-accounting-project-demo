import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SaleAttributes {
  id: number;
  invoiceNumber: string;
  customerId?: number | null;
  customerName?: string | null;
  saleDate: Date;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'SPLIT';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paidAmount: number;
  erpnextInvoiceId?: string | null;
  erpnextPaymentId?: string | null;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SaleCreationAttributes = Optional<
  SaleAttributes,
  | 'id'
  | 'customerId'
  | 'customerName'
  | 'discountAmount'
  | 'taxAmount'
  | 'paymentMethod'
  | 'paymentStatus'
  | 'paidAmount'
  | 'erpnextInvoiceId'
  | 'erpnextPaymentId'
  | 'notes'
>;

export class Sale extends Model<SaleAttributes, SaleCreationAttributes> implements SaleAttributes {
  declare public id: number;
  declare public invoiceNumber: string;
  declare public customerId: number | null;
  declare public customerName: string | null;
  declare public saleDate: Date;
  declare public subtotal: number;
  declare public discountAmount: number;
  declare public taxAmount: number;
  declare public grandTotal: number;
  declare public paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'SPLIT';
  declare public paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  declare public paidAmount: number;
  declare public erpnextInvoiceId: string | null;
  declare public erpnextPaymentId: string | null;
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Sale.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'invoice_number',
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'customer_id',
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    customerName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'customer_name',
    },
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'sale_date',
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
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'BANK', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'SPLIT'),
      defaultValue: 'CASH',
      field: 'payment_method',
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
    erpnextInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_invoice_id',
    },
    erpnextPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_payment_id',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sales',
    timestamps: true,
    underscored: true,
  }
);
