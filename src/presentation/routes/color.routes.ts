/**
 * @module ColorRoutes
 * Car color management endpoint group mounted at `/api/colors`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole('DRIVER') (per route)
 *
 * Endpoints:
 * - GET    /         -- List colors (DRIVER+)
 * - POST   /         -- Create color (DRIVER+)
 * - PATCH  /:id      -- Update color (DRIVER+)
 * - DELETE /:id      -- Delete color (DRIVER+)
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { listColors, createColor, updateColor, deleteColor } from '../controllers/color.controller.js';

const colorRoutes = new Hono();

colorRoutes.use('*', authMiddleware);

colorRoutes.get('/', requireRole('DRIVER'), listColors);
colorRoutes.post('/', requireRole('DRIVER'), createColor);
colorRoutes.patch('/:id', requireRole('DRIVER'), updateColor);
colorRoutes.delete('/:id', requireRole('DRIVER'), deleteColor);

export { colorRoutes };
