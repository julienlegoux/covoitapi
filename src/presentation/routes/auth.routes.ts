import { Hono } from 'hono';
import { login, register } from '../controllers/auth.controller.js';

const authRoutes = new Hono();

// Public routes — no auth, no role check
authRoutes.post('/register', register);
authRoutes.post('/login', login);

export { authRoutes };
