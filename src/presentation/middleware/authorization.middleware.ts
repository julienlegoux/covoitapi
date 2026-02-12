/**
 * @module AuthorizationMiddleware
 * Role-based authorization middleware for the Hono request pipeline.
 *
 * Uses a hierarchical role system (USER < DRIVER < ADMIN) where higher roles
 * automatically inherit access to lower-level endpoints. The middleware reads
 * the `role` value from the Hono context (set by authMiddleware) and compares
 * it against the minimum required role level.
 *
 * **Pipeline position:** Must run after authMiddleware (depends on `role` context value).
 *
 * **Error responses:**
 * - 401 UNAUTHORIZED -- role is not set in context (auth middleware did not run or failed)
 * - 403 FORBIDDEN -- user's role level is below the minimum required
 */
import type { Context, Next } from 'hono';
import type { Logger } from '../../lib/logging/logger.types.js';
import { container } from '../../lib/shared/di/container.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';

/**
 * Role hierarchy mapping. Higher numbers indicate greater privileges.
 * A user with a higher-level role can access endpoints requiring lower-level roles.
 */
const ROLE_HIERARCHY: Record<string, number> = {
	USER: 1,
	DRIVER: 2,
	ADMIN: 3,
};

/**
 * Creates a Hono middleware that enforces minimum role requirements.
 *
 * When multiple roles are specified, the minimum level among them is used
 * as the threshold (i.e., the least-privileged role wins).
 *
 * @param roles - One or more role names (e.g. 'USER', 'DRIVER', 'ADMIN')
 * @returns Hono middleware function that checks `c.get('role')` against the hierarchy
 *
 * @example
 * ```ts
 * // Only DRIVER and ADMIN can access
 * app.post('/cars', requireRole('DRIVER'), createCar);
 *
 * // Only ADMIN can access
 * app.delete('/brands/:id', requireRole('ADMIN'), deleteBrand);
 * ```
 */
export function requireRole(...roles: string[]) {
	return async (c: Context, next: Next) => {
		const logger = container.resolve<Logger>(TOKENS.Logger);
		const userRole = c.get('role') as string | undefined;

		if (!userRole) {
			logger.warn('Authorization failed: no role in context', {
				path: c.req.path,
				method: c.req.method,
			});
			return c.json(
				{ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
				401,
			);
		}

		const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
		const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] ?? Infinity));

		if (userLevel < minRequired) {
			logger.warn('Authorization failed: insufficient role', {
				path: c.req.path,
				method: c.req.method,
				userRole,
				requiredRoles: roles,
			});
			return c.json(
				{ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
				403,
			);
		}

		await next();
	};
}
