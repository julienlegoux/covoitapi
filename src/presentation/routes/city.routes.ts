import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createCity, deleteCity, listCities } from '../controllers/city.controller.js';

const cityRoutes = new Hono();

cityRoutes.use('*', authMiddleware);

cityRoutes.get('/listePostalsCodes', listCities);
cityRoutes.post('/city', createCity);
cityRoutes.delete('/city/:id', deleteCity);

export { cityRoutes };
