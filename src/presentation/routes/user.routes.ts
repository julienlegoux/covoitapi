import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/authorization.middleware.js';
import { updateProfile, anonymizeMe, anonymizeUser } from '../controllers/user.controller.js';
import { listPersons, getPerson, createPerson, updatePerson, patchPerson } from '../controllers/person.controller.js';

const userRoutes = new Hono();

userRoutes.use('*', authMiddleware);

// Profile onboarding
userRoutes.patch('/me', requireRole('USER'), updateProfile);

// GDPR anonymization (self-service)
userRoutes.delete('/me', requireRole('USER'), anonymizeMe);

// CRUD (merged from person)
userRoutes.get('/', requireRole('ADMIN'), listPersons);
userRoutes.get('/:id', requireRole('USER'), getPerson);
userRoutes.post('/', requireRole('USER'), createPerson);
userRoutes.put('/:id', requireRole('USER'), updatePerson);
userRoutes.patch('/:id', requireRole('USER'), patchPerson);
userRoutes.delete('/:id', requireRole('ADMIN'), anonymizeUser);

export { userRoutes };
