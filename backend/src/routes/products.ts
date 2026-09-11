import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/products';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only logged in users can access these routes
router.use(authenticate);

router.get('/', getProducts);
router.get('/:id', getProductById);

// For mutating routes, optionally restrict by roles
router.post('/', authorize(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', authorize(['ADMIN', 'WAREHOUSE']), updateProduct);
router.delete('/:id', authorize(['ADMIN']), deleteProduct);

export default router;
