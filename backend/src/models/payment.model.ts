import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PaymentAttributes {
  id: number;
  paymentNumber: string;
  paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
  referenceType: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'DIRECT';
  referenceId?: number | null;
  partyType: 'CUSTOMER' | 'SUPPLIER';
  partyId: number;
  amount: number;
  paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
  paymentDate: Date;
  transactionReference?: string | null;
  erpnextPaymentEntryId?: string | null;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PaymentCreationAttributes = Optional<
  PaymentAttributes,
  'id' | 'referenceId' | 'transactionReference' | 'erpnextPaymentEntryId' | 'status' | 'notes'
>;

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  declare public id: number;
  declare public paymentNumber: string;
  declare public paymentType: 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYMENT';
  declare public referenceType: 'SALE' | 'PURCHASE' | 'EXPENSE' | 'DIRECT';
  declare public referenceId: number | null;
  declare public partyType: 'CUSTOMER' | 'SUPPLIER';
  declare public partyId: number;
  declare public amount: number;
  declare public paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
  declare public paymentDate: Date;
  declare public transactionReference: string | null;
  declare public erpnextPaymentEntryId: string | null;
  declare public status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  declare public notes: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'payment_number',
    },
    paymentType: {
      type: DataTypes.ENUM('CUSTOMER_PAYMENT', 'SUPPLIER_PAYMENT'),
      allowNull: false,
      field: 'payment_type',
    },
    referenceType: {
      type: DataTypes.ENUM('SALE', 'PURCHASE', 'EXPENSE', 'DIRECT'),
      allowNull: false,
      defaultValue: 'DIRECT',
      field: 'reference_type',
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reference_id',
    },
    partyType: {
      type: DataTypes.ENUM('CUSTOMER', 'SUPPLIER'),
      allowNull: false,
      field: 'party_type',
    },
    partyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'party_id',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      get() {
        const val = this.getDataValue('amount');
        return val === null ? 0 : parseFloat(val as unknown as string);
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'BANK', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD'),
      allowNull: false,
      defaultValue: 'CASH',
      field: 'payment_method',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'payment_date',
    },
    transactionReference: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'transaction_reference',
    },
    erpnextPaymentEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_payment_entry_id',
    },
    status: {
      type: DataTypes.ENUM('COMPLETED', 'PENDING', 'CANCELLED'),
      defaultValue: 'COMPLETED',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    underscored: true,
  }
);
