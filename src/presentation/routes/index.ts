/**
 * @module AppRouter
 * Main Hono application router. Assembles all endpoint groups under the `/api` base path
 * and applies global middleware.
 *
 * **Global middleware (applied to all routes):**
 * 1. bodyLimit -- restricts request body to 1 MB
 * 2. errorHandler -- catches ZodError, DomainError, and unknown errors
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
import { errorHandler } from '../middleware/error-handler.middleware.js';
import { v1Routes } from './v1/index.js';

const app = new Hono().basePath('/api');

app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', errorHandler);

app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.route('/v1', v1Routes);

export { app };
