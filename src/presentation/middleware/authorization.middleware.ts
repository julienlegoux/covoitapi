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

/**
 * Creates a role-checking middleware factory.
 *
 * The returned function accepts one or more role names and produces a
 * Hono middleware that enforces the minimum required role level.
 * When multiple roles are specified, the minimum level among them is used
 * as the threshold (i.e., the least-privileged role wins).
 *
 * @param roleHierarchy - Mapping of role names to numeric privilege levels
 * @param logger - Logger instance for authorization failure logging
 * @returns A function that accepts role names and returns a Hono middleware
 *
 * @example
 * ```ts
 * const requireRole = createRequireRole(ROLE_HIERARCHY, logger);
 *
 * // Only DRIVER and ADMIN can access
 * app.post('/cars', requireRole('DRIVER'), createCar);
 *
 * // Only ADMIN can access
 * app.delete('/brands/:id', requireRole('ADMIN'), deleteBrand);
 * ```
 */
export function createRequireRole(roleHierarchy: Record<string, number>, logger: Logger) {
	return (...roles: string[]) => {
		return async (c: Context, next: Next) => {
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

			const userLevel = roleHierarchy[userRole] ?? 0;
			const minRequired = Math.min(...roles.map((r) => roleHierarchy[r] ?? Infinity));

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
	};
}
