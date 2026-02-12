/**
 * @module UserRoutes
 * User management endpoint group mounted at `/api/users`.
 *
 * Middleware chain: authMiddleware (all routes) -> requireRole (per route)
 *
 * Endpoints:
 * - PATCH  /me       -- Update own profile (USER+)
 * - DELETE /me       -- GDPR self-anonymization (USER+)
 * - GET    /         -- List all users (ADMIN)
 * - GET    /:id      -- Get user by UUID (USER+)
 * - DELETE /:id      -- Anonymize user by UUID (ADMIN)
 *
 * Note: `/me` routes are defined before `/:id` to prevent route shadowing.
 */
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { listUsers, getUser, updateProfile, anonymizeMe, anonymizeUser } from '../controllers/user.controller.js';

const userRoutes = new Hono();

userRoutes.use('*', authMiddleware);

// Profile management
userRoutes.patch('/me', requireRole('USER'), updateProfile);

// GDPR anonymization (self-service)
userRoutes.delete('/me', requireRole('USER'), anonymizeMe);

// User CRUD
userRoutes.get('/', requireRole('ADMIN'), listUsers);
userRoutes.get('/:id', requireRole('USER'), getUser);
userRoutes.delete('/:id', requireRole('ADMIN'), anonymizeUser);

export { userRoutes };
