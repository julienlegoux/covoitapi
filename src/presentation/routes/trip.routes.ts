/**
 * @module TripRoutes
 * Trip (carpooling journey) endpoint group mounted at `/api/trips`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - GET    /         -- List all trips (USER+)
 * - GET    /search   -- Search trips by departure, arrival, date (USER+)
 * - GET    /:id      -- Get trip by UUID (USER+)
 * - POST   /         -- Create trip (DRIVER+)
 * - DELETE /:id      -- Delete trip (DRIVER+)
 */
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/index.js';
import { createTrip, deleteTrip, findTrip, getTrip, listTrips } from '../controllers/trip.controller.js';

const tripRoutes = new Hono();

tripRoutes.use('*', authMiddleware);

tripRoutes.get('/', requireRole('USER'), listTrips);
tripRoutes.get('/search', requireRole('USER'), findTrip);
tripRoutes.get('/:id', requireRole('USER'), getTrip);
tripRoutes.post('/', requireRole('DRIVER'), createTrip);
tripRoutes.delete('/:id', requireRole('DRIVER'), deleteTrip);

export { tripRoutes };
