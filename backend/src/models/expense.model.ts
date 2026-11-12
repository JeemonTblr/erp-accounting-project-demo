import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ExpenseAttributes {
  id: number;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: Date;
  paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
  description?: string | null;
  referenceNumber?: string | null;
  erpnextJournalEntryId?: string | null;
  erpnextPurchaseInvoiceId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ExpenseCreationAttributes = Optional<
  ExpenseAttributes,
  | 'id'
  | 'paymentMethod'
  | 'description'
  | 'referenceNumber'
  | 'erpnextJournalEntryId'
  | 'erpnextPurchaseInvoiceId'
>;

export class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  declare public id: number;
  declare public expenseNumber: string;
  declare public title: string;
  declare public category: string;
  declare public amount: number;
  declare public expenseDate: Date;
  declare public paymentMethod: 'CASH' | 'BANK' | 'UPI' | 'DEBIT_CARD' | 'CREDIT_CARD';
  declare public description: string | null;
  declare public referenceNumber: string | null;
  declare public erpnextJournalEntryId: string | null;
  declare public erpnextPurchaseInvoiceId: string | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expenseNumber: {
      type: DataTypes.STRING(80),
      allowNull: false,
      unique: true,
      field: 'expense_number',
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
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
    expenseDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'expense_date',
    },
    paymentMethod: {
      type: DataTypes.ENUM('CASH', 'BANK', 'UPI', 'DEBIT_CARD', 'CREDIT_CARD'),
      defaultValue: 'CASH',
      field: 'payment_method',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'reference_number',
    },
    erpnextJournalEntryId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_journal_entry_id',
    },
    erpnextPurchaseInvoiceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_purchase_invoice_id',
    },
  },
  {
    sequelize,
    tableName: 'expenses',
    timestamps: true,
    underscored: true,
  }
);
