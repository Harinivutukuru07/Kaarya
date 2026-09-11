import { Router } from 'express';

import authRoutes from './auth';

import customerRoutes from './customers';
import productRoutes from './products';

import challanRoutes from './challans';
import stockMovementRoutes from './stock-movements';

const router = Router();

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/challans', challanRoutes);
router.use('/stock-movements', stockMovementRoutes);

export default router;
