/**
 * @module CarRoutes
 * Car management endpoint group mounted at `/api/cars`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole('DRIVER') (per route)
 *
 * Endpoints:
 * - GET    /         -- List cars (DRIVER+)
 * - POST   /         -- Create car (DRIVER+)
 * - PUT    /:id      -- Full update (DRIVER+)
 * - PATCH  /:id      -- Partial update (DRIVER+)
 * - DELETE /:id      -- Delete car (DRIVER+)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { createCar, deleteCar, listCars, patchCar, updateCar } from '../controllers/car.controller.js';

const carRoutes = new Hono();

carRoutes.use('*', authMiddleware);

carRoutes.get('/', requireRole('DRIVER'), listCars); //TODO : change to admin only and make a separate route for drivers to list their own cars by :id
carRoutes.post('/', requireRole('DRIVER'), createCar);
carRoutes.put('/:id', requireRole('DRIVER'), updateCar);
carRoutes.patch('/:id', requireRole('DRIVER'), patchCar);
carRoutes.delete('/:id', requireRole('DRIVER'), deleteCar);

export { carRoutes };
