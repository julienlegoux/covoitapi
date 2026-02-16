/**
 * @module DriverRoutes
 * Driver registration endpoint group mounted at `/api/drivers`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole('USER') (per route)
 *
 * Endpoints:
 * - POST / -- Register the authenticated user as a driver (USER+)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { createDriver } from '../controllers/driver.controller.js';

const driverRoutes = new Hono();

driverRoutes.use('*', authMiddleware);

driverRoutes.post('/', requireRole('USER'), createDriver);

export { driverRoutes };
