import { Product } from '../../models/product.model';
import { ProductVariant } from '../../models/product-variant.model';
import { sequelize } from '../../config/database';

export class ProductSetter {
  public static async createProduct(
    data: {
      name: string;
      sku: string;
      categoryId: number;
      brand?: string | null;
      size?: string | null;
      colour?: string | null;
      fabricType?: string | null;
      purchasePrice: number;
      sellingPrice: number;
      gstRate?: number;
      stockQuantity?: number;
      reorderLevel?: number;
      isActive?: boolean;
      erpnextItemCode?: string | null;
    },
    variants?: Array<{
      sku: string;
      size?: string | null;
      colour?: string | null;
      additionalPrice?: number;
      stockQuantity?: number;
    }>
  ): Promise<Product> {
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.create(
        {
          name: data.name.trim(),
          sku: data.sku.trim().toUpperCase(),
          categoryId: data.categoryId,
          brand: data.brand ? data.brand.trim() : null,
          size: data.size ? data.size.trim() : null,
          colour: data.colour ? data.colour.trim() : null,
          fabricType: data.fabricType ? data.fabricType.trim() : null,
          purchasePrice: Number(data.purchasePrice),
          sellingPrice: Number(data.sellingPrice),
          gstRate: data.gstRate !== undefined ? Number(data.gstRate) : 5.0,
          stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 0.0,
          reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : 10,
          isActive: data.isActive !== undefined ? data.isActive : true,
          erpnextItemCode: data.erpnextItemCode || null,
        },
        { transaction }
      );

      if (variants && variants.length > 0) {
        for (const v of variants) {
          await ProductVariant.create(
            {
              productId: product.id,
              sku: v.sku.trim().toUpperCase(),
              size: v.size ? v.size.trim() : null,
              colour: v.colour ? v.colour.trim() : null,
              additionalPrice: v.additionalPrice ? Number(v.additionalPrice) : 0.0,
              stockQuantity: v.stockQuantity ? Number(v.stockQuantity) : 0.0,
              isActive: true,
            },
            { transaction }
          );
        }
      }

      await transaction.commit();
      return product;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  public static async updateProduct(
    id: number,
    data: Partial<{
      name: string;
      sku: string;
      categoryId: number;
      brand: string | null;
      size: string | null;
      colour: string | null;
      fabricType: string | null;
      purchasePrice: number;
      sellingPrice: number;
      gstRate: number;
      stockQuantity: number;
      reorderLevel: number;
      isActive: boolean;
      erpnextItemCode: string | null;
    }>
  ): Promise<Product> {
    const product = await Product.findByPk(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    if (data.name !== undefined) product.name = data.name.trim();
    if (data.sku !== undefined) product.sku = data.sku.trim().toUpperCase();
    if (data.categoryId !== undefined) product.categoryId = data.categoryId;
    if (data.brand !== undefined) product.brand = data.brand;
    if (data.size !== undefined) product.size = data.size;
    if (data.colour !== undefined) product.colour = data.colour;
    if (data.fabricType !== undefined) product.fabricType = data.fabricType;
    if (data.purchasePrice !== undefined) product.purchasePrice = Number(data.purchasePrice);
    if (data.sellingPrice !== undefined) product.sellingPrice = Number(data.sellingPrice);
    if (data.gstRate !== undefined) product.gstRate = Number(data.gstRate);
    if (data.stockQuantity !== undefined) product.stockQuantity = Number(data.stockQuantity);
    if (data.reorderLevel !== undefined) product.reorderLevel = Number(data.reorderLevel);
    if (data.isActive !== undefined) product.isActive = data.isActive;
    if (data.erpnextItemCode !== undefined) product.erpnextItemCode = data.erpnextItemCode;

    await product.save();
    return product;
  }

  public static async updateStock(id: number, delta: number, variantId?: number | null): Promise<void> {
    const product = await Product.findByPk(id);
    if (!product) throw new Error(`Product ${id} not found`);

    product.stockQuantity = Number(product.stockQuantity) + Number(delta);
    await product.save();

    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (variant) {
        variant.stockQuantity = Number(variant.stockQuantity) + Number(delta);
        await variant.save();
      }
    }
  }

  public static async deleteProduct(id: number): Promise<boolean> {
    const product = await Product.findByPk(id);
    if (!product) {
      const error = new Error(`Product with ID ${id} not found.`);
      (error as unknown as { statusCode: number }).statusCode = 404;
      throw error;
    }

    await product.destroy();
    return true;
  }

  public static async addVariant(
    productId: number,
    data: {
      sku: string;
      size?: string | null;
      colour?: string | null;
      additionalPrice?: number;
      stockQuantity?: number;
    }
  ): Promise<ProductVariant> {
    return ProductVariant.create({
      productId,
      sku: data.sku.trim().toUpperCase(),
      size: data.size ? data.size.trim() : null,
      colour: data.colour ? data.colour.trim() : null,
      additionalPrice: data.additionalPrice ? Number(data.additionalPrice) : 0.0,
      stockQuantity: data.stockQuantity ? Number(data.stockQuantity) : 0.0,
      isActive: true,
    });
  }

  public static async deleteVariant(variantId: number): Promise<boolean> {
    const variant = await ProductVariant.findByPk(variantId);
    if (!variant) throw new Error(`Variant ${variantId} not found`);
    await variant.destroy();
    return true;
  }
}

