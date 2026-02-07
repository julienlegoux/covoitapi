import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
	createInscription,
	deleteInscription,
	listInscriptions,
	listRoutePassengers,
	listUserInscriptions,
} from '../controllers/inscription.controller.js';

const inscriptionRoutes = new Hono();

inscriptionRoutes.use('*', authMiddleware);

inscriptionRoutes.get('/listInscriptions', listInscriptions);
inscriptionRoutes.get('/listInscriptionsUsers/:idpers', listUserInscriptions);
inscriptionRoutes.get('/listPassengersDriver/:idtrajet', listRoutePassengers);
inscriptionRoutes.post('/inscription', createInscription);
inscriptionRoutes.delete('/inscription/:id', deleteInscription);

export { inscriptionRoutes };
