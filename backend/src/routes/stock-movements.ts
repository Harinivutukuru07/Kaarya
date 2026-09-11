import { Router } from 'express';
import { getStockMovements, createStockMovement } from '../controllers/stock-movements';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getStockMovements);
router.post('/', authorize(['ADMIN', 'WAREHOUSE']), createStockMovement);

export default router;
