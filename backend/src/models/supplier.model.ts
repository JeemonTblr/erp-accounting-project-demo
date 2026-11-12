import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface SupplierAttributes {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstin?: string | null;
  supplierType: string;
  erpnextSupplierId?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SupplierCreationAttributes = Optional<
  SupplierAttributes,
  'id' | 'phone' | 'email' | 'address' | 'gstin' | 'supplierType' | 'erpnextSupplierId' | 'isActive'
>;

export class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
  declare public id: number;
  declare public name: string;
  declare public phone: string | null;
  declare public email: string | null;
  declare public address: string | null;
  declare public gstin: string | null;
  declare public supplierType: string;
  declare public erpnextSupplierId: string | null;
  declare public isActive: boolean;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

Supplier.init(
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
    supplierType: {
      type: DataTypes.STRING(50),
      defaultValue: 'Wholesaler',
      field: 'supplier_type',
    },
    erpnextSupplierId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'erpnext_supplier_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    tableName: 'suppliers',
    timestamps: true,
    underscored: true,
  }
);
