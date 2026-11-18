"use strict";

const { Router } = require("express");
const { CrmController } = require("./controller");

const router = Router();

// ─── Section 3: CRM Data Endpoints (GET) ───────────────────────────────────
router.get("/company", CrmController.getCompany);
router.get("/customers", CrmController.getCustomers);
router.get("/suppliers", CrmController.getSuppliers);
router.get("/products", CrmController.getProducts);
router.get("/invoices", CrmController.getInvoices);
router.get("/receipts", CrmController.getReceipts);
router.get("/expenses", CrmController.getExpenses);
router.get("/bills", CrmController.getBills);
router.get("/outstanding", CrmController.getOutstanding);
router.get("/account-mapping", CrmController.getAccountMapping);
router.get("/all", CrmController.getAll);
router.get("/sync-status", CrmController.getSyncStatus);

// ─── Section 6: CRM-to-EAccounting Sync Endpoints (POST) ───────────────────
router.post("/customers/sync", CrmController.syncCustomer);
router.post("/suppliers/sync", CrmController.syncSupplier);
router.post("/products/sync", CrmController.syncProduct);
router.post("/invoices/sync", CrmController.syncInvoice);
router.post("/receipts/sync", CrmController.syncReceipt);
router.post("/expenses/sync", CrmController.syncExpense);
router.post("/bills/sync", CrmController.syncBill);
router.post("/sync-all", CrmController.syncAll);

module.exports = router;

