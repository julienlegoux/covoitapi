import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { createDriver } from '../controllers/driver.controller.js';

const driverRoutes = new Hono();

driverRoutes.use('*', authMiddleware);

driverRoutes.post('/', requireRole('USER'), createDriver);

export { driverRoutes };
