import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { errorHandler } from '../middleware/error-handler.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { authRoutes } from './auth.routes.js';
import { brandRoutes } from './brand.routes.js';
import { carRoutes } from './car.routes.js';
import { cityRoutes } from './city.routes.js';
import { colorRoutes } from './color.routes.js';
import { driverRoutes } from './driver.routes.js';
import { travelRoutes } from './travel.routes.js';
import { inscriptionRoutes } from './inscription.routes.js';
import { userRoutes } from './user.routes.js';
import { listUserInscriptions, listRoutePassengers } from '../controllers/inscription.controller.js';

const app = new Hono().basePath('/api');

app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', errorHandler);

app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route('/auth', authRoutes);
app.route('/brands', brandRoutes);
app.route('/cars', carRoutes);
app.route('/cities', cityRoutes);
app.route('/colors', colorRoutes);
app.route('/drivers', driverRoutes);
app.route('/travels', travelRoutes);
app.route('/inscriptions', inscriptionRoutes);
app.route('/users', userRoutes);

// Nested resource routes
app.get('/users/:id/inscriptions', authMiddleware, requireRole('USER'), listUserInscriptions);
app.get('/travels/:id/passengers', authMiddleware, requireRole('USER'), listRoutePassengers);

export { app };
