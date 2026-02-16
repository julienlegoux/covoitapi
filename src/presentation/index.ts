/**
 * @module Presentation
 * Barrel export for the presentation layer.
 *
 * Re-exports key controllers, middleware, the assembled Hono app, and
 * shared types for use by the application entry point and integration tests.
 */

// Controllers
export * from './controllers/auth.controller.js';

// Middleware
export { authMiddleware, errorHandler } from './middleware/index.js';
export { app } from './routes/index.js';

// Types
export type { ErrorResponse } from '../lib/errors/error.types.js';
