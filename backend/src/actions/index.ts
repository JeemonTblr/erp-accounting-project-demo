import { Router } from 'express';
import healthRoute from './health/route';
import userRoute from './user/route';
import categoryRoute from './category/route';
import customerRoute from './customer/route';
import supplierRoute from './supplier/route';
import productRoute from './product/route';
import saleRoute from './sale/route';
import purchaseRoute from './purchase/route';
import expenseRoute from './expense/route';
import paymentRoute from './payment/route';
import inventoryRoute from './inventory/route';
import erpSyncRoute from './erp-sync/route';
import reportsRoute from './reports/route';
import dashboardRoute from './dashboard/route';

const actionsRouter = Router();

// Health & database diagnostic routes
actionsRouter.use('/', healthRoute);

// Business module routes — each table module lives under its REST resource path
actionsRouter.use('/dashboard', dashboardRoute);
actionsRouter.use('/reports', reportsRoute);
actionsRouter.use('/users', userRoute);
actionsRouter.use('/auth', userRoute); // Alias: /api/auth/login, /api/auth/register
actionsRouter.use('/categories', categoryRoute);
actionsRouter.use('/customers', customerRoute);
actionsRouter.use('/suppliers', supplierRoute);
actionsRouter.use('/products', productRoute);
actionsRouter.use('/sales', saleRoute);
actionsRouter.use('/purchases', purchaseRoute);
actionsRouter.use('/expenses', expenseRoute);
actionsRouter.use('/payments', paymentRoute);
actionsRouter.use('/inventory', inventoryRoute);
actionsRouter.use('/erp-sync', erpSyncRoute);

export default actionsRouter;
