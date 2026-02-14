/**
 * @module TravelRoutes
 * Travel/route (carpooling journey) endpoint group mounted at `/api/travels`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - GET    /         -- List all travels (USER+)
 * - GET    /search   -- Search travels by departure, arrival, date (USER+)
 * - GET    /:id      -- Get travel by UUID (USER+)
 * - POST   /         -- Create travel (DRIVER+)
 * - DELETE /:id      -- Delete travel (DRIVER+)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { createRoute, deleteRoute, findRoute, getRoute, listRoutes } from '../controllers/route.controller.js';

const travelRoutes = new Hono();

travelRoutes.use('*', authMiddleware);

travelRoutes.get('/', requireRole('USER'), listRoutes);
travelRoutes.get('/search', requireRole('USER'), findRoute);
travelRoutes.get('/:id', requireRole('USER'), getRoute);
travelRoutes.post('/', requireRole('DRIVER'), createRoute);
travelRoutes.delete('/:id', requireRole('DRIVER'), deleteRoute);

export { travelRoutes };
