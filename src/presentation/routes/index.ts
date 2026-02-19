/**
 * @module AppRouter
 * Main Hono application router. Serves the landing page at `/` and assembles
 * all API endpoint groups under the `/api` base path with global middleware.
 *
 * **Landing page:**
 * - GET / -- UML analysis documentation page (public, no auth)
 *
 * **Global API middleware (applied to /api/* routes):**
 * 1. secureHeaders -- sets security headers (HSTS, X-Content-Type-Options, etc.)
 * 2. cors -- handles CORS preflight and response headers
 * 3. requestLogger -- logs requests and responses
 * 4. bodyLimit -- restricts request body to 1 MB
 * 5. errorHandler -- catches ZodError, DomainError, and unknown errors
 *
 * **Endpoint groups:**
 * - /api/auth          -- Authentication (public)
 * - /api/brands        -- Car brands (auth + role)
 * - /api/cars          -- Cars (auth + role)
 * - /api/cities        -- Cities (auth + role)
 * - /api/colors        -- Car colors (auth + role)
 * - /api/drivers       -- Driver registration (auth + role)
 * - /api/travels       -- Travel routes (auth + role)
 * - /api/inscriptions  -- Passenger inscriptions (auth + role)
 * - /api/users         -- User management (auth + role)
 *
 * **Nested resource routes (defined directly, not in sub-routers):**
 * - GET /api/users/:id/inscriptions    -- User's inscriptions (auth + USER+)
 * - GET /api/travels/:id/passengers    -- Travel's passengers (auth + USER+)
 *
 * **Utility:**
 * - GET /api/health -- Health check (public, no auth)
 */
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { errorHandler, requestLogger } from '../middleware/index.js';
import { v1Routes } from './v1/index.js';
import { vpRoutes } from '../vp/routes.js';
import { landingHandler } from '../pages/landing.js';

const app = new Hono();

// Landing page — public, no middleware
app.get('/', landingHandler);

// API sub-router with middleware
const api = new Hono();

api.use('*', secureHeaders());
api.use('*', cors({ origin: '*' }));
api.use('*', requestLogger);
api.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
api.onError(errorHandler);

api.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

api.route('/v1', v1Routes);
api.route('/vp', vpRoutes);

app.route('/api', api);

export { app };
