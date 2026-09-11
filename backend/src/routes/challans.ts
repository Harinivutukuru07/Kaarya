import { Router } from 'express';
import { getChallans, getChallanById, createChallan, cancelChallan, confirmChallan } from '../controllers/challans';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getChallans);
router.get('/:id', getChallanById);
router.post('/', authorize(['ADMIN', 'SALES']), createChallan);
router.post('/:id/cancel', authorize(['ADMIN', 'SALES']), cancelChallan);
router.post('/:id/confirm', authorize(['ADMIN', 'SALES']), confirmChallan);

export default router;
