/**
 * @module AuthRoutes
 * Authentication endpoint group mounted at `/api/auth`.
 *
 * All routes in this group are **public** -- no authMiddleware or role checks.
 * Rate limiting is applied to prevent brute-force and abuse.
 *
 * Endpoints:
 * - POST /register -- Create a new user account (3 req/min)
 * - POST /login    -- Authenticate and receive a JWT token (5 req/min)
 */
import { Hono } from 'hono';
import { rateLimiter } from 'hono-rate-limiter';
import { login, register } from '../controllers/auth.controller.js';

const loginLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 5,
	keyGenerator: (c) => c.req.header('x-forwarded-for') ?? 'unknown',
	message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again later' } },
});

const registerLimiter = rateLimiter({
	windowMs: 60 * 1000,
	limit: 3,
	keyGenerator: (c) => c.req.header('x-forwarded-for') ?? 'unknown',
	message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many registration attempts, please try again later' } },
});

const authRoutes = new Hono();

// Public routes — no auth, no role check, rate limited
authRoutes.post('/register', registerLimiter, register);
authRoutes.post('/login', loginLimiter, login);

export { authRoutes };
