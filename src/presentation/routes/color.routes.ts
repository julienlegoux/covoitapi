/**
 * @module ColorRoutes
 * Car color management endpoint group mounted at `/api/colors`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - GET    /         -- List colors (DRIVER+)
 * - POST   /         -- Create color (ADMIN only)
 * - PATCH  /:id      -- Update color (ADMIN only)
 * - DELETE /:id      -- Delete color (ADMIN only)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { listColors, createColor, updateColor, deleteColor } from '../controllers/color.controller.js';

const colorRoutes = new Hono();

colorRoutes.use('*', authMiddleware);

colorRoutes.get('/', requireRole('DRIVER'), listColors);
colorRoutes.post('/', requireRole('ADMIN'), createColor);
colorRoutes.patch('/:id', requireRole('ADMIN'), updateColor);
colorRoutes.delete('/:id', requireRole('ADMIN'), deleteColor);

export { colorRoutes };
