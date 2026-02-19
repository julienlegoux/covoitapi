/**
 * @module Middleware
 * Composition root for middleware. Resolves dependencies from the DI container
 * and creates pre-configured middleware instances ready for route registration.
 *
 * This is the **only** middleware file that imports from the DI container.
 * Route files import from this barrel instead of importing factory functions directly.
 *
 * Dependencies are resolved lazily on first use, allowing integration tests to
 * register mocks before the middleware captures its dependencies. Call
 * `resetMiddleware()` in test setup to force re-resolution after mock registration.
 */
import type { Context, Next } from 'hono';
import type { Logger } from '../../lib/logging/logger.types.js';
import type { JwtService } from '../../domain/services/jwt.service.js';
import { container } from '../../lib/shared/di/container.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { ROLE_HIERARCHY } from '../../domain/authorization/role-hierarchy.js';
import { createAuthMiddleware } from './auth.middleware.js';
import { createRequireRole } from './authorization.middleware.js';
import { createErrorHandler } from './error-handler.middleware.js';
import { createRequestLogger } from './request-logger.middleware.js';

type MiddlewareInstances = {
	authMiddleware: ReturnType<typeof createAuthMiddleware>;
	requireRole: ReturnType<typeof createRequireRole>;
	errorHandler: ReturnType<typeof createErrorHandler>;
	requestLogger: ReturnType<typeof createRequestLogger>;
};

let _instances: MiddlewareInstances | null = null;

function resolve(): MiddlewareInstances {
	if (!_instances) {
		const logger = container.resolve<Logger>(TOKENS.Logger);
		const jwtService = container.resolve<JwtService>(TOKENS.JwtService);
		_instances = {
			authMiddleware: createAuthMiddleware(jwtService, logger),
			requireRole: createRequireRole(ROLE_HIERARCHY, logger),
			errorHandler: createErrorHandler(logger),
			requestLogger: createRequestLogger(logger),
		};
	}
	return _instances;
}

/**
 * Forces re-resolution of all middleware dependencies from the DI container.
 * Use in integration test `beforeEach` after registering mock services.
 */
export function resetMiddleware(): void {
	_instances = null;
}

// Proxy exports that lazily resolve on first use
export const authMiddleware = (c: Context, next: Next) => resolve().authMiddleware(c, next);

export const requireRole = (...roles: string[]) => resolve().requireRole(...roles);

export const errorHandler = (err: Error, c: Context) => resolve().errorHandler(err, c);

export const requestLogger = (c: Context, next: Next) => resolve().requestLogger(c, next);
