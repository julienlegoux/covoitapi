import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createBrand, deleteBrand, listBrands } from '../controllers/brand.controller.js';

const brandRoutes = new Hono();

brandRoutes.use('*', authMiddleware);

brandRoutes.get('/listBrands', listBrands);
brandRoutes.post('/brand', createBrand);
brandRoutes.delete('/brand/:id', deleteBrand);

export { brandRoutes };
