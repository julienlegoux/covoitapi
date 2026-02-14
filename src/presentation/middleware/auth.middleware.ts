/**
 * @module AuthMiddleware
 * JWT authentication middleware for the Hono request pipeline.
 *
 * Extracts the bearer token from the `x-auth-token` request header,
 * verifies it via the injected JwtService, and sets `userId` and `role`
 * on the Hono context for downstream handlers.
 *
 * **Context values set on success:**
 * - `userId` (string) -- the authenticated user's UUID
 * - `role` (string) -- the user's role (as returned by JwtService)
 *
 * **Error responses:**
 * - 401 UNAUTHORIZED -- missing token header
 * - 401 TOKEN_EXPIRED / TOKEN_INVALID -- JWT verification failure
 * - 400 TOKEN_MALFORMED -- malformed JWT
 */
import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { JwtService } from '../../domain/services/jwt.service.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import { updateContext } from '../../lib/context/request-context.js';
import { getHttpStatus } from '../../lib/errors/error-registry.js';

/**
 * Creates a Hono middleware that authenticates requests via JWT.
 *
 * Reads the `x-auth-token` header, verifies it, and populates the context
 * with `userId` and `role`. Returns an error response if the token is
 * missing, expired, invalid, or malformed.
 *
 * @param jwtService - Service for JWT token verification
 * @param logger - Logger instance for auth failure logging
 * @returns Hono middleware function
 */
export function createAuthMiddleware(jwtService: JwtService, logger: Logger) {
	return async (c: Context, next: Next): Promise<Response | undefined> => {
		const token = c.req.header('x-auth-token');

		if (!token) {
			logger.warn('Auth failed: missing token', {
				path: c.req.path,
				method: c.req.method,
			});
			return c.json(
				{
					success: false,
					error: {
						code: 'UNAUTHORIZED',
						message: 'Authentication token is required',
					},
				},
				401,
			);
		}

		const result = await jwtService.verify(token);

		if (result.success) {
			c.set('userId', result.value.userId);
			c.set('role', result.value.role);
			updateContext({ userId: result.value.userId });
			await next();
			return;
		}

		logger.warn('Auth failed: invalid token', {
			path: c.req.path,
			method: c.req.method,
			errorCode: result.error.code,
		});

		const httpStatus = getHttpStatus(result.error.code) as ContentfulStatusCode;
		return c.json(
			{
				success: false,
				error: {
					code: result.error.code,
					message: result.error.message,
				},
			},
			httpStatus,
		);
	};
}
