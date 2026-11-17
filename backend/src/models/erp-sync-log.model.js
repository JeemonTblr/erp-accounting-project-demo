const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
class ErpSyncLog extends Model {
}
ErpSyncLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    localTransactionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "local_transaction_id"
    },
    transactionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "transaction_type"
    },
    erpnextDocumentType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: "erpnext_document_type"
    },
    erpnextDocumentName: {
      type: DataTypes.STRING(120),
      allowNull: true,
      field: "erpnext_document_name"
    },
    syncStatus: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "SYNCED", "FAILED"),
      defaultValue: "PENDING",
      field: "sync_status"
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message"
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "retry_count"
    },
    payload: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_synced_at"
    }
  },
  {
    sequelize,
    tableName: "erp_sync_logs",
    timestamps: true,
    underscored: true
  }
);
module.exports = {
  ErpSyncLog,
};
