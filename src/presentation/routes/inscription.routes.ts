import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import {
	createInscription,
	deleteInscription,
	listInscriptions,
} from '../controllers/inscription.controller.js';

const inscriptionRoutes = new Hono();

inscriptionRoutes.use('*', authMiddleware);

inscriptionRoutes.get('/', requireRole('USER'), listInscriptions);
inscriptionRoutes.post('/', requireRole('USER'), createInscription);
inscriptionRoutes.delete('/:id', requireRole('USER'), deleteInscription);

export { inscriptionRoutes };
