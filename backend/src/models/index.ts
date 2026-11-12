import { sequelize } from '../config/database';
import { User } from './user.model';
import { Category } from './category.model';
import { Product } from './product.model';
import { ProductVariant } from './product-variant.model';
import { Customer } from './customer.model';
import { Supplier } from './supplier.model';
import { Sale } from './sale.model';
import { SaleItem } from './sale-item.model';
import { Purchase } from './purchase.model';
import { PurchaseItem } from './purchase-item.model';
import { Expense } from './expense.model';
import { Payment } from './payment.model';
import { InventoryTransaction } from './inventory-transaction.model';
import { ErpSyncLog } from './erp-sync-log.model';

// Category <-> Product (1:N)
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Product <-> ProductVariant (1:N)
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Customer <-> Sale (1:N)
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales', onDelete: 'SET NULL' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Sale <-> SaleItem (1:N)
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items', onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

// Product <-> SaleItem (1:N)
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems', onDelete: 'RESTRICT' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ProductVariant <-> SaleItem (1:N)
ProductVariant.hasMany(SaleItem, { foreignKey: 'variantId', as: 'saleItems', onDelete: 'SET NULL' });
SaleItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

// Supplier <-> Purchase (1:N)
Supplier.hasMany(Purchase, { foreignKey: 'supplierId', as: 'purchases', onDelete: 'RESTRICT' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Purchase <-> PurchaseItem (1:N)
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId', as: 'items', onDelete: 'CASCADE' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId', as: 'purchase' });

// Product <-> PurchaseItem (1:N)
Product.hasMany(PurchaseItem, { foreignKey: 'productId', as: 'purchaseItems', onDelete: 'RESTRICT' });
PurchaseItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ProductVariant <-> PurchaseItem (1:N)
ProductVariant.hasMany(PurchaseItem, { foreignKey: 'variantId', as: 'purchaseItems', onDelete: 'SET NULL' });
PurchaseItem.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

// Product <-> InventoryTransaction (1:N)
Product.hasMany(InventoryTransaction, { foreignKey: 'productId', as: 'inventoryTransactions', onDelete: 'CASCADE' });
InventoryTransaction.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// ProductVariant <-> InventoryTransaction (1:N)
ProductVariant.hasMany(InventoryTransaction, {
  foreignKey: 'variantId',
  as: 'inventoryTransactions',
  onDelete: 'SET NULL',
});
InventoryTransaction.belongsTo(ProductVariant, { foreignKey: 'variantId', as: 'variant' });

export const initDatabase = async (alter = false): Promise<void> => {
  await sequelize.sync({ alter });
};

export {
  sequelize,
  User,
  Category,
  Product,
  ProductVariant,
  Customer,
  Supplier,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  Expense,
  Payment,
  InventoryTransaction,
  ErpSyncLog,
};

