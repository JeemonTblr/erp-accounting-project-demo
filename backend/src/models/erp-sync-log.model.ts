import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ErpSyncLogAttributes {
  id: number;
  localTransactionId: string;
  transactionType: string;
  erpnextDocumentType: string;
  erpnextDocumentName?: string | null;
  syncStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  errorMessage?: string | null;
  retryCount: number;
  payload?: string | null;
  lastSyncedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ErpSyncLogCreationAttributes = Optional<
  ErpSyncLogAttributes,
  'id' | 'erpnextDocumentName' | 'syncStatus' | 'errorMessage' | 'retryCount' | 'payload' | 'lastSyncedAt'
>;

export class ErpSyncLog
  extends Model<ErpSyncLogAttributes, ErpSyncLogCreationAttributes>
  implements ErpSyncLogAttributes {
  declare public id: number;
  declare public localTransactionId: string;
  declare public transactionType: string;
  declare public erpnextDocumentType: string;
  declare public erpnextDocumentName: string | null;
  declare public syncStatus: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  declare public errorMessage: string | null;
  declare public retryCount: number;
  declare public payload: string | null;
  declare public lastSyncedAt: Date | null;

  declare public readonly createdAt: Date;
  declare public readonly updatedAt: Date;
}

ErpSyncLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    localTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'local_transaction_id',
    },
    transactionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'transaction_type',
    },
    erpnextDocumentType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'erpnext_document_type',
    },
    erpnextDocumentName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: 'erpnext_document_name',
    },
    syncStatus: {
      type: DataTypes.ENUM('PENDING', 'PROCESSING', 'SYNCED', 'FAILED'),
      defaultValue: 'PENDING',
      field: 'sync_status',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'retry_count',
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_synced_at',
    },
  },
  {
    sequelize,
    tableName: 'erp_sync_logs',
    timestamps: true,
    underscored: true,
  }
);