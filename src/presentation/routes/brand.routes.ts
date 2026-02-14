/**
 * @module BrandRoutes
 * Car brand endpoint group mounted at `/api/brands`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - GET    /         -- List brands (DRIVER+)
 * - POST   /         -- Create brand (ADMIN)
 * - DELETE /:id      -- Delete brand (ADMIN)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { createBrand, deleteBrand, listBrands } from '../controllers/brand.controller.js';

const brandRoutes = new Hono();

brandRoutes.use('*', authMiddleware);

brandRoutes.get('/', requireRole('DRIVER'), listBrands);
brandRoutes.post('/', requireRole('ADMIN'), createBrand);
brandRoutes.delete('/:id', requireRole('ADMIN'), deleteBrand);

export { brandRoutes };
