import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface CustomerAttributes {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  customerType: string;
  erpnextCustomerId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CustomerCreationAttributes = Optional<
  CustomerAttributes,
  'id' | 'phone' | 'email' | 'address' | 'gstin' | 'customerType' | 'erpnextCustomerId' | 'isActive'
>;

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  declare public id: number;
  declare public name: string;
  declare public phone: string | null;
  declare public email: string | null;
  declare public address: string | null;
  declare public gstin: string | null;
  declare public customerType: string;
  declare public erpnextCustomerId: string | null;
  declare public isActive: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Customer.init(
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
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gstin: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    customerType: {
      type: DataTypes.STRING(50),
      defaultValue: 'Individual',
      field: 'customer_type',
    },
    erpnextCustomerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_customer_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    underscored: true,
  }
);
