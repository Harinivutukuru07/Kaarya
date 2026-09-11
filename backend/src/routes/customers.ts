import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customers';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only logged in users can access these routes
router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

// For mutating routes, optionally restrict by roles if needed
// e.g., router.post('/', authorize(['ADMIN', 'SALES']), createCustomer);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', authorize(['ADMIN']), deleteCustomer);

export default router;
