import { Hono } from 'hono';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';
import { authRoutes } from '../auth.routes.js';
import { brandRoutes } from '../brand.routes.js';
import { carRoutes } from '../car.routes.js';
import { cityRoutes } from '../city.routes.js';
import { colorRoutes } from '../color.routes.js';
import { driverRoutes } from '../driver.routes.js';
import { travelRoutes } from '../travel.routes.js';
import { inscriptionRoutes } from '../inscription.routes.js';
import { userRoutes } from '../user.routes.js';
import { listUserInscriptions, listRoutePassengers } from '../../controllers/inscription.controller.js';

const v1Routes = new Hono();

v1Routes.route('/auth', authRoutes);
v1Routes.route('/brands', brandRoutes);
v1Routes.route('/cars', carRoutes);
v1Routes.route('/cities', cityRoutes);
v1Routes.route('/colors', colorRoutes);
v1Routes.route('/drivers', driverRoutes);
v1Routes.route('/travels', travelRoutes);
v1Routes.route('/inscriptions', inscriptionRoutes);
v1Routes.route('/users', userRoutes);

// Nested resource routes
v1Routes.get('/users/:id/inscriptions', authMiddleware, requireRole('USER'), listUserInscriptions);
v1Routes.get('/travels/:id/passengers', authMiddleware, requireRole('USER'), listRoutePassengers);

export { v1Routes };
