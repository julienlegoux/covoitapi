import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createRoute, deleteRoute, findRoute, getRoute, listRoutes } from '../controllers/route.controller.js';

const routeRoutes = new Hono();

routeRoutes.use('*', authMiddleware);

routeRoutes.get('/listRoutes', listRoutes);
routeRoutes.get('/route/:id', getRoute);
routeRoutes.get('/findRoute', findRoute);
routeRoutes.post('/route', createRoute);
routeRoutes.delete('/route/:id', deleteRoute);

export { routeRoutes };
