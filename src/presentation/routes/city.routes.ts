/**
 * @module CityRoutes
 * City management endpoint group mounted at `/api/cities`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - GET    /         -- List cities (USER+)
 * - POST   /         -- Create city (USER+)
 * - DELETE /:id      -- Delete city (ADMIN)
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { createCity, deleteCity, listCities } from '../controllers/city.controller.js';

const cityRoutes = new Hono();

cityRoutes.use('*', authMiddleware);

cityRoutes.get('/', requireRole('USER'), listCities);
cityRoutes.post('/', requireRole('USER'), createCity);
cityRoutes.delete('/:id', requireRole('ADMIN'), deleteCity);

export { cityRoutes };
