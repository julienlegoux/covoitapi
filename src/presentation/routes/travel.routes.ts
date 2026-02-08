import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { createRoute, deleteRoute, findRoute, getRoute, listRoutes } from '../controllers/route.controller.js';

const travelRoutes = new Hono();

travelRoutes.use('*', authMiddleware);

travelRoutes.get('/', requireRole('USER'), listRoutes);
travelRoutes.get('/search', requireRole('USER'), findRoute);
travelRoutes.get('/:id', requireRole('USER'), getRoute);
travelRoutes.post('/', requireRole('DRIVER'), createRoute);
travelRoutes.delete('/:id', requireRole('DRIVER'), deleteRoute);

export { travelRoutes };
