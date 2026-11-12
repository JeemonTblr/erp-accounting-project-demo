/**
 * seed-dummy-data.ts
 * Comprehensive dummy data seeder for Clothing & Textiles Shop Management System.
 * Synchronizes all records with ERPNext accounting module via Frappe REST API.
 */
import { sequelize } from '../config/database';
import { Customer } from '../models/customer.model';
import { Supplier } from '../models/supplier.model';
import { Product } from '../models/product.model';
import { Sale } from '../models/sale.model';
import { SaleItem } from '../models/sale-item.model';
import { Purchase } from '../models/purchase.model';
import { PurchaseItem } from '../models/purchase-item.model';
import { Expense } from '../models/expense.model';
import { InventoryTransaction } from '../models/inventory-transaction.model';
import { ErpSyncLog } from '../models/erp-sync-log.model';

import { ErpCustomerService } from '../helpers/erpnext/customer.service';
import { ErpSupplierService } from '../helpers/erpnext/supplier.service';
import { ErpItemService } from '../helpers/erpnext/item.service';
import { ErpSalesInvoiceService } from '../helpers/erpnext/sales-invoice.service';
import { ErpPurchaseInvoiceService } from '../helpers/erpnext/purchase-invoice.service';
import { ErpPaymentEntryService } from '../helpers/erpnext/payment-entry.service';
import { ErpExpenseService } from '../helpers/erpnext/expense.service';
import { ErpStockService } from '../helpers/erpnext/stock.service';

async function seed() {
  console.log('====================================================');
  console.log('🧵 Starting Textile Shop ERP Dummy Data Seeder...');
  console.log('====================================================\n');

  await sequelize.authenticate();
  console.log('✅ Connected to MariaDB textile_erp_db.\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SEED CUSTOMERS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('📦 1. Seeding Customers & Syncing to ERPNext...');
  const customerDefs = [
    {
      name: 'Ananya Sharma',
      phone: '9845112233',
      email: 'ananya.sharma@gmail.com',
      address: 'Plot 45, Panampilly Nagar, Kochi',
      customerType: 'Individual' as const,
      gstin: '32AAACS1234A1Z1',
    },
    {
      name: 'Kochi Silk Boutique',
      phone: '9847113355',
      email: 'orders@kochiboutique.com',
      address: 'Broadway Market, Marine Drive, Kochi',
      customerType: 'Company' as const,
      gstin: '32AABCK5544B1Z9',
    },
    {
      name: 'Rajesh Retailer',
      phone: '9846001122',
      email: 'rajesh.menwear@yahoo.com',
      address: '14 MG Road, Ernakulam',
      customerType: 'Individual' as const,
    },
    {
      name: 'Calicut Textile Traders',
      phone: '9847009988',
      email: 'contact@calicuttextiles.com',
      address: 'SM Street, Kozhikode',
      customerType: 'Company' as const,
      gstin: '32AACCC8877C1Z3',
    },
    {
      name: 'Meera Nair',
      phone: '9847224466',
      email: 'meera.designer@outlook.com',
      address: 'Aluva Palace Road, Kochi',
      customerType: 'Individual' as const,
    },
  ];

  const seededCustomers: Customer[] = [];
  for (const c of customerDefs) {
    let cust = await Customer.findOne({ where: { name: c.name } });
    if (!cust) {
      cust = await Customer.create(c);
      console.log(`   + Created local customer: ${c.name}`);
    }

    if (!cust.erpnextCustomerId) {
      try {
        const erpDocName = await ErpCustomerService.createCustomer({
          name: cust.name,
          customerType: cust.customerType,
          email: cust.email || undefined,
          phone: cust.phone || undefined,
          address: cust.address || undefined,
          gstin: cust.gstin || undefined,
        });
        await cust.update({ erpnextCustomerId: erpDocName });
        console.log(`   → Synced to ERPNext Customer: ${erpDocName}`);
      } catch (err: unknown) {
        console.warn(`   ⚠️ ERPNext Customer sync note for ${c.name}:`, (err as Error).message);
      }
    }
    seededCustomers.push(cust);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SEED SUPPLIERS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 2. Seeding Suppliers & Syncing to ERPNext...');
  const supplierDefs = [
    {
      name: 'Surat Cotton Mills Ltd',
      phone: '9825012345',
      email: 'sales@suratcottonmills.com',
      address: 'Ring Road, Textile Market, Surat, Gujarat',
      gstin: '24AABCS1122C1Z9',
      supplierType: 'Manufacturer',
    },
    {
      name: 'Kanchipuram Silk Weavers Co-op',
      phone: '9840054321',
      email: 'orders@kanchisilk.org',
      address: 'Gandhi Road, Kanchipuram, Tamil Nadu',
      gstin: '33AAACK4455D1Z2',
      supplierType: 'Manufacturer',
    },
    {
      name: 'Raymond Suiting & Shirting Mills',
      phone: '9820011223',
      email: 'b2b@raymondmills.com',
      address: 'Pokhran Road, Thane, Maharashtra',
      gstin: '27AABCR9988E1Z1',
      supplierType: 'Manufacturer',
    },
    {
      name: 'Bombay Dyeing Textiles Ltd',
      phone: '9821033445',
      email: 'dealer@bombaydyeing.com',
      address: 'Neville House, Ballard Estate, Mumbai',
      gstin: '27AAACB3344F1Z4',
      supplierType: 'Manufacturer',
    },
    {
      name: 'Kerala Handloom Federation',
      phone: '9847088776',
      email: 'trade@keralahandlooms.gov.in',
      address: 'Vanchiyoor, Thiruvananthapuram, Kerala',
      gstin: '32AAACK8877G1Z7',
      supplierType: 'Wholesaler',
    },
  ];

  const seededSuppliers: Supplier[] = [];
  for (const s of supplierDefs) {
    let supp = await Supplier.findOne({ where: { name: s.name } });
    if (!supp) {
      supp = await Supplier.create(s);
      console.log(`   + Created local supplier: ${s.name}`);
    }

    if (!supp.erpnextSupplierId) {
      try {
        const erpDocName = await ErpSupplierService.createSupplier({
          name: supp.name,
          supplierType: supp.supplierType || 'Manufacturer',
          email: supp.email || undefined,
          phone: supp.phone || undefined,
          gstin: supp.gstin || undefined,
        });
        await supp.update({ erpnextSupplierId: erpDocName });
        console.log(`   → Synced to ERPNext Supplier: ${erpDocName}`);
      } catch (err: unknown) {
        console.warn(`   ⚠️ ERPNext Supplier sync note for ${s.name}:`, (err as Error).message);
      }
    }
    seededSuppliers.push(supp);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SEED PRODUCTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 3. Seeding Product Catalog & Syncing to ERPNext Items...');
  const productDefs = [
    {
      name: 'Kanchipuram Pure Silk Saree',
      sku: 'SAR-KAN-01',
      categoryId: 4, // Sarees
      brand: 'Kanchipuram Silk',
      size: '6.2 Meters',
      colour: 'Crimson Red & Gold',
      fabricType: 'Pure Silk',
      purchasePrice: 4200,
      sellingPrice: 8499,
      gstRate: 5,
      stockQuantity: 25,
      reorderLevel: 5,
    },
    {
      name: 'Kerala Kasavu Handloom Saree',
      sku: 'SAR-KAS-02',
      categoryId: 4, // Sarees
      brand: 'Kerala Handlooms',
      size: '6.0 Meters',
      colour: 'Off-White & Gold Zari',
      fabricType: 'Pure Cotton',
      purchasePrice: 1100,
      sellingPrice: 2299,
      gstRate: 5,
      stockQuantity: 35,
      reorderLevel: 8,
    },
    {
      name: 'Raymond Formal Linen Shirt',
      sku: 'SHT-RAY-01',
      categoryId: 5, // Shirts
      brand: 'Raymond',
      size: '42 / L',
      colour: 'Ice Blue',
      fabricType: 'French Linen',
      purchasePrice: 650,
      sellingPrice: 1499,
      gstRate: 5,
      stockQuantity: 40,
      reorderLevel: 10,
    },
    {
      name: 'Men Slim Fit Denim Jeans',
      sku: 'JNS-DNM-01',
      categoryId: 7, // Jeans
      brand: 'Raymond',
      size: '34W x 32L',
      colour: 'Indigo Dark Wash',
      fabricType: 'Stretch Denim',
      purchasePrice: 750,
      sellingPrice: 1699,
      gstRate: 5,
      stockQuantity: 30,
      reorderLevel: 8,
    },
    {
      name: 'Chanderi Embroidered Kurti',
      sku: 'KRT-CHN-01',
      categoryId: 2, // Women's Wear
      brand: 'Handloom Co-op',
      size: 'XL',
      colour: 'Emerald Green',
      fabricType: 'Chanderi Silk Cotton',
      purchasePrice: 380,
      sellingPrice: 899,
      gstRate: 5,
      stockQuantity: 50,
      reorderLevel: 10,
    },
    {
      name: 'Raymond Woollen Suiting Fabric 3m',
      sku: 'FAB-SUT-01',
      categoryId: 9, // Fabrics
      brand: 'Raymond',
      size: '3.0 Meters Cut',
      colour: 'Charcoal Grey',
      fabricType: 'Poly Wool',
      purchasePrice: 1400,
      sellingPrice: 2999,
      gstRate: 5,
      stockQuantity: 20,
      reorderLevel: 5,
    },
    {
      name: 'Bombay Dyeing Double Bedspread',
      sku: 'HOM-BED-01',
      categoryId: 8, // Dress Materials
      brand: 'Bombay Dyeing',
      size: 'Double King (90x108 in)',
      colour: 'Floral Blue',
      fabricType: '100% Glace Cotton',
      purchasePrice: 480,
      sellingPrice: 1099,
      gstRate: 5,
      stockQuantity: 30,
      reorderLevel: 5,
    },
    {
      name: 'Banarasi Brocade Silk Dupatta',
      sku: 'ACC-BAN-01',
      categoryId: 10, // Accessories
      brand: 'Handloom Co-op',
      size: '2.5 Meters',
      colour: 'Royal Purple & Gold',
      fabricType: 'Banarasi Silk',
      purchasePrice: 320,
      sellingPrice: 799,
      gstRate: 5,
      stockQuantity: 45,
      reorderLevel: 10,
    },
    {
      name: 'Boys Festive Kurta Pyjama Set',
      sku: 'KID-KRT-01',
      categoryId: 3, // Kids Wear
      brand: 'Raymond',
      size: 'Age 8-10',
      colour: 'Mustard Yellow',
      fabricType: 'Cotton Silk Blend',
      purchasePrice: 420,
      sellingPrice: 949,
      gstRate: 5,
      stockQuantity: 25,
      reorderLevel: 5,
    },
    {
      name: 'Men Linen Casual Chino Trousers',
      sku: 'TRS-LIN-01',
      categoryId: 1, // Men's Wear
      brand: 'Raymond',
      size: '32 Regular',
      colour: 'Beige Khaki',
      fabricType: 'Pure Linen',
      purchasePrice: 680,
      sellingPrice: 1549,
      gstRate: 5,
      stockQuantity: 30,
      reorderLevel: 6,
    },
  ];

  const seededProducts: Product[] = [];
  for (const p of productDefs) {
    let prod = await Product.findOne({ where: { sku: p.sku } });
    if (!prod) {
      prod = await Product.create(p);
      console.log(`   + Created local product: ${p.name} (${p.sku})`);
    }

    if (!prod.erpnextItemCode) {
      try {
        const erpDocName = await ErpItemService.createItem({
          sku: prod.sku,
          name: prod.name,
          categoryName: 'Products',
          brand: prod.brand || 'Raymond',
          sellingPrice: Number(prod.sellingPrice),
          purchasePrice: Number(prod.purchasePrice),
          stockQuantity: prod.stockQuantity,
          gstRate: prod.gstRate,
        });
        await prod.update({ erpnextItemCode: erpDocName });
        console.log(`   → Synced to ERPNext Item: ${erpDocName}`);
      } catch (err: unknown) {
        console.warn(`   ⚠️ ERPNext Item sync note for ${p.sku}:`, (err as Error).message);
      }
    }
    seededProducts.push(prod);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SEED PURCHASES & ERPNEXT PURCHASE INVOICES + PAYMENT ENTRIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 4. Seeding Restocking Purchases & ERPNext Purchase Invoices...');
  const purchaseOrders = [
    {
      supplier: seededSuppliers[0], // Surat Cotton Mills
      date: '2026-11-02',
      items: [
        { product: seededProducts[4], qty: 15, rate: 380 }, // Kurti
        { product: seededProducts[6], qty: 10, rate: 480 }, // Bedspread
      ],
      paymentMethod: 'BANK',
      notes: 'Festival batch inventory restocking',
    },
    {
      supplier: seededSuppliers[1], // Kanchipuram Weavers
      date: '2026-11-05',
      items: [
        { product: seededProducts[0], qty: 5, rate: 4200 }, // Silk Saree
        { product: seededProducts[7], qty: 15, rate: 320 }, // Dupatta
      ],
      paymentMethod: 'BANK',
      notes: 'Wedding season sarees procurement',
    },
    {
      supplier: seededSuppliers[2], // Raymond Suiting Mills
      date: '2026-11-08',
      items: [
        { product: seededProducts[2], qty: 15, rate: 650 },  // Shirts
        { product: seededProducts[5], qty: 8, rate: 1400 },  // Suiting Fabric
      ],
      paymentMethod: 'BANK',
      notes: 'Formal suiting and linen restocking',
    },
    {
      supplier: seededSuppliers[4], // Kerala Handloom
      date: '2026-11-10',
      items: [
        { product: seededProducts[1], qty: 15, rate: 1100 }, // Kasavu Saree
      ],
      paymentMethod: 'BANK',
      notes: 'Traditional kasavu handloom replenishment',
    },
  ];

  for (let i = 0; i < purchaseOrders.length; i++) {
    const po = purchaseOrders[i];
    const poNumber = `PUR-2026-BATCH-${i + 1}`;
    const existing = await Purchase.findOne({ where: { purchaseNumber: poNumber } });
    if (existing) {
      console.log(`   • Purchase ${poNumber} already exists.`);
      continue;
    }

    let subtotal = 0;
    const poItemsData = po.items.map((it) => {
      const lineTotal = it.qty * it.rate;
      subtotal += lineTotal;
      return {
        productId: it.product.id,
        itemName: it.product.name,
        sku: it.product.sku,
        quantity: it.qty,
        unitPrice: it.rate,
        totalAmount: lineTotal,
      };
    });

    const taxAmount = subtotal * 0.05;
    const grandTotal = subtotal + taxAmount;

    // 1. Create Purchase Record
    const purchase = await Purchase.create({
      purchaseNumber: poNumber,
      supplierId: po.supplier.id,
      purchaseDate: new Date(po.date),
      subtotal,
      taxAmount,
      grandTotal,
      paymentStatus: 'PAID',
      paidAmount: grandTotal,
      notes: po.notes,
    });

    // 2. Create Items & increment local stock
    for (const item of poItemsData) {
      await PurchaseItem.create({
        purchaseId: purchase.id,
        productId: item.productId,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
      });

      await Product.increment('stockQuantity', {
        by: item.quantity,
        where: { id: item.productId },
      });

      await InventoryTransaction.create({
        productId: item.productId,
        transactionType: 'STOCK_IN',
        quantity: item.quantity,
        referenceType: 'PURCHASE',
        referenceId: purchase.id,
        notes: `Restocked via ${poNumber}`,
      });
    }

    // 3. Sync to ERPNext Purchase Invoice + Payment Entry
    try {
      const erpItems = po.items.map((it) => ({
        itemCode: it.product.erpnextItemCode || it.product.sku,
        qty: it.qty,
        rate: it.rate,
        description: it.product.name,
      }));

      const { invoiceName } = await ErpPurchaseInvoiceService.createAndSubmitPurchaseInvoice({
        supplierName: po.supplier.erpnextSupplierId || po.supplier.name,
        postingDate: po.date,
        items: erpItems,
        remarks: `Purchase Order ${poNumber}`,
        updateStock: true,
      });

      console.log(`   + Created & Submitted ERPNext Purchase Invoice: ${invoiceName} (₹${grandTotal.toFixed(2)})`);

      const payment = await ErpPaymentEntryService.createAndSubmitSupplierPayment({
        supplierName: po.supplier.erpnextSupplierId || po.supplier.name,
        amount: grandTotal,
        paymentMethod: po.paymentMethod,
        invoiceName: invoiceName,
        postingDate: po.date,
        referenceNumber: poNumber,
      });

      console.log(`   → Generated ERPNext Payment Entry: ${payment.paymentName}`);

      await purchase.update({
        erpnextPurchaseInvoiceId: invoiceName,
      });

      await ErpSyncLog.create({
        localTransactionId: poNumber,
        transactionType: 'PURCHASE',
        erpnextDocumentType: 'Purchase Invoice',
        erpnextDocumentName: invoiceName,
        syncStatus: 'SYNCED',
        payload: JSON.stringify({ poNumber, grandTotal, invoiceName, payment: payment.paymentName }),
        lastSyncedAt: new Date(),
      });
    } catch (err: unknown) {
      console.warn(`   ⚠️ ERPNext Purchase sync note for ${poNumber}:`, (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SEED SALES (POS) & ERPNEXT SALES INVOICES + PAYMENT ENTRIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 5. Seeding Daily Sales & Syncing to ERPNext Sales Invoices...');
  const salesOrders = [
    {
      customer: seededCustomers[0], // Ananya Sharma
      date: '2026-11-06',
      items: [
        { product: seededProducts[0], qty: 1, price: 8499 }, // Silk Saree
        { product: seededProducts[7], qty: 1, price: 799 },  // Dupatta
      ],
      paymentMethod: 'CASH' as const,
      paymentStatus: 'PAID' as const,
      notes: 'Customer retail purchase - Wedding Gift',
    },
    {
      customer: seededCustomers[2], // Rajesh Retailer
      date: '2026-11-07',
      items: [
        { product: seededProducts[2], qty: 2, price: 1499 }, // Linen Shirt
        { product: seededProducts[3], qty: 1, price: 1699 }, // Jeans
      ],
      paymentMethod: 'BANK' as const,
      paymentStatus: 'PAID' as const,
      notes: 'Men formal and casual wear',
    },
    {
      customer: seededCustomers[4], // Meera Nair
      date: '2026-11-09',
      items: [
        { product: seededProducts[4], qty: 2, price: 899 },  // Kurti
        { product: seededProducts[1], qty: 1, price: 2299 }, // Kasavu Saree
      ],
      paymentMethod: 'BANK' as const,
      paymentStatus: 'PAID' as const,
      notes: 'Designer boutique selection',
    },
    {
      customer: seededCustomers[1], // Kochi Silk Boutique (Wholesale Credit Sale!)
      date: '2026-11-10',
      items: [
        { product: seededProducts[0], qty: 3, price: 8499 }, // 3x Silk Sarees
        { product: seededProducts[5], qty: 2, price: 2999 }, // 2x Suiting Fabric
      ],
      paymentMethod: 'BANK' as const,
      paymentStatus: 'PARTIAL' as const,
      paidAmount: 15000, // Partial payment -> Generates Customer Receivable!
      notes: 'Wholesale consignment order - 30 days credit for balance',
    },
    {
      customer: seededCustomers[0], // Walk-in
      date: '2026-11-11',
      items: [
        { product: seededProducts[1], qty: 1, price: 2299 }, // Kasavu Saree
        { product: seededProducts[6], qty: 1, price: 1099 }, // Bedspread
      ],
      paymentMethod: 'CASH' as const,
      paymentStatus: 'PAID' as const,
      notes: 'Store walk-in retail purchase',
    },
    {
      customer: seededCustomers[3], // Calicut Textile Traders
      date: '2026-11-11',
      items: [
        { product: seededProducts[8], qty: 2, price: 949 },  // Kids wear
        { product: seededProducts[9], qty: 2, price: 1549 }, // Linen trousers
      ],
      paymentMethod: 'BANK' as const,
      paymentStatus: 'PAID' as const,
      notes: 'Festive retail order',
    },
  ];

  for (let i = 0; i < salesOrders.length; i++) {
    const so = salesOrders[i];
    const invoiceNum = `INV-2026-DEMO-${i + 1}`;
    const existing = await Sale.findOne({ where: { invoiceNumber: invoiceNum } });
    if (existing) {
      console.log(`   • Sale ${invoiceNum} already exists.`);
      continue;
    }

    let subtotal = 0;
    const saleItemsData = so.items.map((it) => {
      const lineTotal = it.qty * it.price;
      subtotal += lineTotal;
      return {
        productId: it.product.id,
        itemName: it.product.name,
        sku: it.product.sku,
        quantity: it.qty,
        unitPrice: it.price,
        totalAmount: lineTotal,
      };
    });

    const taxAmount = subtotal * 0.05;
    const grandTotal = subtotal + taxAmount;
    const paidAmount = so.paidAmount !== undefined ? so.paidAmount : (so.paymentStatus === 'PAID' ? grandTotal : 0);

    // 1. Create Sale Record
    const sale = await Sale.create({
      invoiceNumber: invoiceNum,
      customerId: so.customer.id,
      saleDate: new Date(so.date),
      subtotal,
      taxAmount,
      grandTotal,
      paymentMethod: so.paymentMethod,
      paymentStatus: so.paymentStatus,
      paidAmount,
      notes: so.notes,
    });

    // 2. Create Items & decrement stock
    for (const item of saleItemsData) {
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        itemName: item.itemName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalAmount,
      });

      await Product.decrement('stockQuantity', {
        by: item.quantity,
        where: { id: item.productId },
      });

      await InventoryTransaction.create({
        productId: item.productId,
        transactionType: 'STOCK_OUT',
        quantity: -item.quantity,
        referenceType: 'SALE',
        referenceId: sale.id,
        notes: `Sold via ${invoiceNum}`,
      });
    }

    // 3. Sync to ERPNext Sales Invoice + Payment Entry
    try {
      const erpItems = so.items.map((it) => ({
        itemCode: it.product.erpnextItemCode || it.product.sku,
        qty: it.qty,
        rate: it.price,
        description: it.product.name,
      }));

      const { invoiceName } = await ErpSalesInvoiceService.createAndSubmitInvoice({
        customerName: so.customer.erpnextCustomerId || so.customer.name,
        postingDate: so.date,
        items: erpItems,
        remarks: `Point of Sale ${invoiceNum}`,
        updateStock: true,
      });

      console.log(`   + Created & Submitted ERPNext Sales Invoice: ${invoiceName} (₹${grandTotal.toFixed(2)})`);

      let paymentEntryId: string | null = null;
      if (paidAmount > 0) {
        const payment = await ErpPaymentEntryService.createAndSubmitCustomerPayment({
          customerName: so.customer.erpnextCustomerId || so.customer.name,
          amount: paidAmount,
          paymentMethod: so.paymentMethod,
          invoiceName: invoiceName,
          postingDate: so.date,
          referenceNumber: invoiceNum,
        });
        paymentEntryId = payment.paymentName;
        console.log(`   → Generated ERPNext Payment Entry: ${paymentEntryId} (Received: ₹${paidAmount})`);
      }

      await sale.update({
        erpnextInvoiceId: invoiceName,
        erpnextPaymentId: paymentEntryId,
      });

      await ErpSyncLog.create({
        localTransactionId: invoiceNum,
        transactionType: 'SALE',
        erpnextDocumentType: 'Sales Invoice',
        erpnextDocumentName: invoiceName,
        syncStatus: 'SYNCED',
        payload: JSON.stringify({ invoiceNum, grandTotal, paidAmount, invoiceName, paymentEntryId }),
        lastSyncedAt: new Date(),
      });
    } catch (err: unknown) {
      console.warn(`   ⚠️ ERPNext Sales sync note for ${invoiceNum}:`, (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SEED DAILY OPERATIONAL EXPENSES & ERPNEXT JOURNAL ENTRIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 6. Seeding Daily Expenses & Syncing to ERPNext Journal Entries...');
  const expenseDefs = [
    {
      title: 'Showroom Commercial Rent (Nov 2026)',
      category: 'Rent',
      amount: 25000,
      paymentMethod: 'BANK' as const,
      referenceNumber: 'RENT-NOV-2026',
      description: 'Monthly commercial showroom premises rent',
      expenseDate: '2026-11-01',
    },
    {
      title: 'Showroom Electricity & Power Utility Bill',
      category: 'Electricity',
      amount: 3850,
      paymentMethod: 'BANK' as const,
      referenceNumber: 'EBILL-1126-KSEB',
      description: 'Electricity board power consumption charges',
      expenseDate: '2026-11-04',
    },
    {
      title: 'Store Staff Salaries & Festive Bonus Advance',
      category: 'Salary',
      amount: 28000,
      paymentMethod: 'BANK' as const,
      referenceNumber: 'SAL-NOV-W1',
      description: 'Weekly payroll for sales staff and cashier',
      expenseDate: '2026-11-07',
    },
    {
      title: 'Showroom AC Servicing & Deep Cleaning',
      category: 'Maintenance',
      amount: 2400,
      paymentMethod: 'CASH' as const,
      referenceNumber: 'MAINT-AC-01',
      description: 'HVAC repair and showroom floor polishing',
      expenseDate: '2026-11-08',
    },
    {
      title: 'Festival Social Media & Local Newspaper Ads',
      category: 'Marketing',
      amount: 7500,
      paymentMethod: 'BANK' as const,
      referenceNumber: 'MKT-NOV-FEST',
      description: 'Diwali and wedding collection print advertisements',
      expenseDate: '2026-11-09',
    },
    {
      title: 'Fabric Consignment Freight & Transport',
      category: 'Travel',
      amount: 3200,
      paymentMethod: 'CASH' as const,
      referenceNumber: 'LOG-FREIGHT-99',
      description: 'Truck logistics for delivery from Surat textile market',
      expenseDate: '2026-11-10',
    },
    {
      title: 'Tea, Refreshments & Packaging Stationery',
      category: 'Miscellaneous',
      amount: 1450,
      paymentMethod: 'CASH' as const,
      referenceNumber: 'PETTY-NOV-02',
      description: 'Carry bags, price tags, and customer tea refreshments',
      expenseDate: '2026-11-11',
    },
  ];

  for (let idx = 0; idx < expenseDefs.length; idx++) {
    const exp = expenseDefs[idx];
    const existing = await Expense.findOne({ where: { referenceNumber: exp.referenceNumber } });
    if (existing) {
      console.log(`   • Expense ${exp.referenceNumber} already exists.`);
      continue;
    }

    const expNum = `EXP-2026-${Date.now() + idx}`;
    const expense = await Expense.create({
      expenseNumber: expNum,
      title: exp.title,
      category: exp.category,
      amount: exp.amount,
      expenseDate: new Date(exp.expenseDate),
      paymentMethod: exp.paymentMethod,
      referenceNumber: exp.referenceNumber,
      description: exp.description,
    });

    try {
      const jv = await ErpExpenseService.createAndSubmitJournalEntry({
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        postingDate: exp.expenseDate,
        description: exp.description,
        referenceNumber: exp.referenceNumber,
      });

      await expense.update({
        erpnextJournalEntryId: jv.journalEntryName,
      });

      console.log(`   + Created & Submitted ERPNext Journal Entry: ${jv.journalEntryName} (₹${exp.amount})`);

      await ErpSyncLog.create({
        localTransactionId: String(expense.id),
        transactionType: 'EXPENSE',
        erpnextDocumentType: 'Journal Entry',
        erpnextDocumentName: jv.journalEntryName,
        syncStatus: 'SYNCED',
        payload: JSON.stringify({ id: expense.id, title: exp.title, amount: exp.amount, jv: jv.journalEntryName }),
        lastSyncedAt: new Date(),
      });
    } catch (err: unknown) {
      console.warn(`   ⚠️ ERPNext Expense sync note for ${exp.title}:`, (err as Error).message);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. SEED STOCK ADJUSTMENT / DAMAGE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n📦 7. Seeding Inventory Damage & ERPNext Material Issue...');
  try {
    const damagedProduct = seededProducts[1]; // Kasavu Saree
    const damageQty = 2;

    await Product.decrement('stockQuantity', {
      by: damageQty,
      where: { id: damagedProduct.id },
    });

    const tx = await InventoryTransaction.create({
      productId: damagedProduct.id,
      transactionType: 'DAMAGE',
      quantity: -damageQty,
      referenceType: 'ADJUSTMENT',
      notes: 'Fabric water damage in storage during monsoon',
    });

    const stockEntry = await ErpStockService.createAndSubmitStockEntry({
      entryType: 'Material Issue',
      postingDate: '2026-11-10',
      warehouse: 'Stores - C',
      remarks: `Inventory Damage Voucher #${tx.id}`,
      items: [
        {
          itemCode: damagedProduct.erpnextItemCode || damagedProduct.sku,
          qty: damageQty,
          rate: Number(damagedProduct.purchasePrice),
        },
      ],
    });

    await tx.update({ erpnextStockEntryId: stockEntry.stockEntryName });
    console.log(`   + Created & Submitted ERPNext Stock Entry: ${stockEntry.stockEntryName} (Material Issue x${damageQty})`);

    await ErpSyncLog.create({
      localTransactionId: String(tx.id),
      transactionType: 'INVENTORY_ADJUSTMENT',
      erpnextDocumentType: 'Stock Entry',
      erpnextDocumentName: stockEntry.stockEntryName,
      syncStatus: 'SYNCED',
      payload: JSON.stringify({ txId: tx.id, product: damagedProduct.name, qty: damageQty, stockEntry: stockEntry.stockEntryName }),
      lastSyncedAt: new Date(),
    });
  } catch (err: unknown) {
    console.warn('   ⚠️ ERPNext Stock damage entry note:', (err as Error).message);
  }

  console.log('\n====================================================');
  console.log('🎉 Comprehensive Dummy Data Seeding Completed Successfully!');
  console.log('====================================================\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seeder encountered fatal error:', err);
    process.exit(1);
  });
