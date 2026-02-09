import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { createCar, deleteCar, listCars, patchCar, updateCar } from '../controllers/car.controller.js';

const carRoutes = new Hono();

carRoutes.use('*', authMiddleware);

carRoutes.get('/', requireRole('DRIVER'), listCars); //TODO : change to admin only and make a separate route for drivers to list their own cars by :id 
carRoutes.post('/', requireRole('DRIVER'), createCar);
carRoutes.put('/:id', requireRole('DRIVER'), updateCar);
carRoutes.patch('/:id', requireRole('DRIVER'), patchCar);
carRoutes.delete('/:id', requireRole('DRIVER'), deleteCar);

export { carRoutes };
