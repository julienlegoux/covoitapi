import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createCar, deleteCar, listCars, patchCar, updateCar } from '../controllers/car.controller.js';

const carRoutes = new Hono();

carRoutes.use('*', authMiddleware);

carRoutes.get('/listCars', listCars);
carRoutes.post('/car', createCar);
carRoutes.put('/car/:id', updateCar);
carRoutes.patch('/car/:id', patchCar);
carRoutes.delete('/car/:id', deleteCar);

export { carRoutes };
