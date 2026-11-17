const { sequelize } = require("../config/database");
const { User } = require("./user.model");
const { Category } = require("./category.model");
const { Product } = require("./product.model");
const { ProductVariant } = require("./product-variant.model");
const { Customer } = require("./customer.model");
const { Supplier } = require("./supplier.model");
const { Sale } = require("./sale.model");
const { SaleItem } = require("./sale-item.model");
const { Purchase } = require("./purchase.model");
const { PurchaseItem } = require("./purchase-item.model");
const { Expense } = require("./expense.model");
const { Payment } = require("./payment.model");
const { InventoryTransaction } = require("./inventory-transaction.model");
const { ErpSyncLog } = require("./erp-sync-log.model");
Category.hasMany(Product, { foreignKey: "categoryId", as: "products", onDelete: "RESTRICT" });
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants", onDelete: "CASCADE" });
ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });
Customer.hasMany(Sale, { foreignKey: "customerId", as: "sales", onDelete: "SET NULL" });
Sale.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Sale.hasMany(SaleItem, { foreignKey: "saleId", as: "items", onDelete: "CASCADE" });
SaleItem.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });
Product.hasMany(SaleItem, { foreignKey: "productId", as: "saleItems", onDelete: "RESTRICT" });
SaleItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
ProductVariant.hasMany(SaleItem, { foreignKey: "variantId", as: "saleItems", onDelete: "SET NULL" });
SaleItem.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });
Supplier.hasMany(Purchase, { foreignKey: "supplierId", as: "purchases", onDelete: "RESTRICT" });
Purchase.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });
Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId", as: "items", onDelete: "CASCADE" });
PurchaseItem.belongsTo(Purchase, { foreignKey: "purchaseId", as: "purchase" });
Product.hasMany(PurchaseItem, { foreignKey: "productId", as: "purchaseItems", onDelete: "RESTRICT" });
PurchaseItem.belongsTo(Product, { foreignKey: "productId", as: "product" });
ProductVariant.hasMany(PurchaseItem, { foreignKey: "variantId", as: "purchaseItems", onDelete: "SET NULL" });
PurchaseItem.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });
Product.hasMany(InventoryTransaction, { foreignKey: "productId", as: "inventoryTransactions", onDelete: "CASCADE" });
InventoryTransaction.belongsTo(Product, { foreignKey: "productId", as: "product" });
ProductVariant.hasMany(InventoryTransaction, {
  foreignKey: "variantId",
  as: "inventoryTransactions",
  onDelete: "SET NULL"
});
InventoryTransaction.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });
const initDatabase = async (alter = false) => {
  await sequelize.sync({ alter });
};
module.exports = {
  Category,
  Customer,
  ErpSyncLog,
  Expense,
  InventoryTransaction,
  Payment,
  Product,
  ProductVariant,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Supplier,
  User,
  initDatabase,
  sequelize,
};
