import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { createPerson, deletePerson, getPerson, listPersons, patchPerson, updatePerson } from '../controllers/person.controller.js';

const personRoutes = new Hono();

personRoutes.use('*', authMiddleware);

personRoutes.get('/listPersons', listPersons);
personRoutes.get('/person/:id', getPerson);
personRoutes.post('/person', createPerson);
personRoutes.put('/person/:idpers', updatePerson);
personRoutes.patch('/person/:idpers', patchPerson);
personRoutes.delete('/person/:id', deletePerson);

export { personRoutes };
