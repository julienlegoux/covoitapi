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
