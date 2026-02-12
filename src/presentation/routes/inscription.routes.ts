/**
 * @module InscriptionRoutes
 * Inscription (passenger sign-up) endpoint group mounted at `/api/inscriptions`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole('USER') (per route)
 *
 * Endpoints:
 * - GET    /         -- List all inscriptions (USER+)
 * - POST   /         -- Create inscription for authenticated user (USER+)
 * - DELETE /:id      -- Cancel inscription (USER+)
 *
 * Note: Additional nested routes for per-user and per-route inscriptions
 * are defined in the main router (routes/index.ts):
 * - GET /api/users/:id/inscriptions
 * - GET /api/travels/:id/passengers
 */
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
