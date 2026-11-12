import { Request, Response, NextFunction } from 'express';
import { ProductSetter } from './setter';
import { ProductGetter } from './getter';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ErpItemService } from '../../helpers/erpnext/item.service';
import { ErpSyncSetter } from '../erp-sync/setter';

export class ProductController {
  public static async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        sku,
        categoryId,
        brand,
        size,
        colour,
        fabricType,
        purchasePrice,
        sellingPrice,
        gstRate,
        stockQuantity,
        reorderLevel,
        variants,
      } = req.body;

      if (!name || !sku || !categoryId) {
        res.status(400).json({
          success: false,
          message: 'Product name, SKU, and categoryId are required.',
        });
        return;
      }

      const existing = await ProductGetter.fetchBySku(sku);
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Product with SKU "${sku}" already exists.`,
        });
        return;
      }

      // 1. Create locally in MariaDB
      const product = await ProductSetter.createProduct(
        {
          name,
          sku,
          categoryId,
          brand,
          size,
          colour,
          fabricType,
          purchasePrice: purchasePrice || 0,
          sellingPrice: sellingPrice || 0,
          gstRate,
          stockQuantity,
          reorderLevel,
        },
        variants
      );

      // 2. Look up category name for ERPNext Item Group mapping
      const category = await Category.findByPk(categoryId);
      const categoryName = category?.name ?? null;

      // 3. Initialize ERPNext sync log
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(product.id),
        transactionType: 'ITEM_SYNC',
        erpnextDocumentType: 'Item',
        syncStatus: 'PROCESSING',
        payload: JSON.stringify({ sku: product.sku, name: product.name, sellingPrice: product.sellingPrice }),
      });

      // 4. Attempt sync to ERPNext
      let erpSyncStatus = 'SYNCED';
      let erpSyncError: string | null = null;
      try {
        const erpItemCode = await ErpItemService.sync({
          sku: product.sku,
          name: product.name,
          categoryName,
          brand: product.brand,
          sellingPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          stockQuantity: product.stockQuantity,
          gstRate: product.gstRate,
        });

        await ProductSetter.updateProduct(product.id, { erpnextItemCode: erpItemCode });
        await ErpSyncSetter.markSynced(syncLog.id, erpItemCode);
      } catch (err: unknown) {
        erpSyncStatus = 'FAILED';
        erpSyncError = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, erpSyncError);
      }

      const created = await ProductGetter.fetchById(product.id);
      res.status(201).json({
        success: true,
        message: 'Product created successfully.',
        data: created,
        erpSync: {
          status: erpSyncStatus,
          error: erpSyncError,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid product ID' });
        return;
      }

      const updated = await ProductSetter.updateProduct(id, req.body);

      // If already linked in ERPNext, sync changes
      if (updated.erpnextItemCode) {
        try {
          const category = updated.categoryId ? await Category.findByPk(updated.categoryId) : null;
          await ErpItemService.updateItem(updated.erpnextItemCode, {
            name: updated.name,
            sellingPrice: updated.sellingPrice,
            purchasePrice: updated.purchasePrice,
            brand: updated.brand,
            categoryName: category?.name,
          });
        } catch (err) {
          console.error(`Failed to update item in ERPNext: ${err}`);
        }
      }

      const refreshed = await ProductGetter.fetchById(updated.id);
      res.status(200).json({
        success: true,
        message: 'Product updated successfully.',
        data: refreshed,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async syncToErp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid product ID' });
        return;
      }

      const product = await Product.findByPk(id);
      if (!product) {
        res.status(404).json({ success: false, message: `Product ${id} not found` });
        return;
      }

      const category = await Category.findByPk(product.categoryId);
      const syncLog = await ErpSyncSetter.createLog({
        localTransactionId: String(product.id),
        transactionType: 'ITEM_SYNC',
        erpnextDocumentType: 'Item',
        syncStatus: 'PROCESSING',
      });

      try {
        const erpItemCode = await ErpItemService.sync({
          sku: product.sku,
          name: product.name,
          categoryName: category?.name ?? null,
          brand: product.brand,
          sellingPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          stockQuantity: product.stockQuantity,
          gstRate: product.gstRate,
          existingErpnextCode: product.erpnextItemCode,
        });

        await ProductSetter.updateProduct(product.id, { erpnextItemCode: erpItemCode });
        await ErpSyncSetter.markSynced(syncLog.id, erpItemCode);

        const refreshed = await ProductGetter.fetchById(product.id);
        res.status(200).json({
          success: true,
          message: 'Product successfully synced to ERPNext.',
          erpnextItemCode: erpItemCode,
          data: refreshed,
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await ErpSyncSetter.markFailed(syncLog.id, errorMsg);
        res.status(502).json({
          success: false,
          message: `ERPNext sync failed: ${errorMsg}`,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Invalid product ID' });
        return;
      }

      await ProductSetter.deleteProduct(id);
      res.status(200).json({
        success: true,
        message: `Product with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const productId = parseInt(req.params.id, 10);
      if (isNaN(productId)) {
        res.status(400).json({ success: false, message: 'Invalid product ID' });
        return;
      }

      const variant = await ProductSetter.addVariant(productId, req.body);
      res.status(201).json({
        success: true,
        message: 'Variant added successfully.',
        data: variant,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteVariant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const variantId = parseInt(req.params.variantId, 10);
      if (isNaN(variantId)) {
        res.status(400).json({ success: false, message: 'Invalid variant ID' });
        return;
      }

      await ProductSetter.deleteVariant(variantId);
      res.status(200).json({
        success: true,
        message: `Variant with ID ${variantId} deleted successfully.`,
      });
    } catch (error) {
      next(error);
    }
  }
}
