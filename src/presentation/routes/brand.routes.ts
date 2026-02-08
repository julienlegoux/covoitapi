import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { createBrand, deleteBrand, listBrands } from '../controllers/brand.controller.js';

const brandRoutes = new Hono();

brandRoutes.use('*', authMiddleware);

brandRoutes.get('/', requireRole('DRIVER'), listBrands);
brandRoutes.post('/', requireRole('ADMIN'), createBrand);
brandRoutes.delete('/:id', requireRole('ADMIN'), deleteBrand);

export { brandRoutes };
