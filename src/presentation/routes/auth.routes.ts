/**
 * @module AuthRoutes
 * Authentication endpoint group mounted at `/api/auth`.
 *
 * All routes in this group are **public** -- no authMiddleware or role checks.
 *
 * Endpoints:
 * - POST /register -- Create a new user account
 * - POST /login    -- Authenticate and receive a JWT token
 */
import { Hono } from 'hono';
import { login, register } from '../controllers/auth.controller.js';

const authRoutes = new Hono();

// Public routes — no auth, no role check
authRoutes.post('/register', register);
authRoutes.post('/login', login);

export { authRoutes };
