import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createDriver } from '../controllers/driver.controller.js';

const driverRoutes = new Hono();

driverRoutes.use('*', authMiddleware);

driverRoutes.post('/driver', createDriver);

export { driverRoutes };
