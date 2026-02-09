import type { Context, Next } from 'hono';

const ROLE_HIERARCHY: Record<string, number> = {
	USER: 1,
	DRIVER: 2,
	ADMIN: 3,
};

export function requireRole(...roles: string[]) {
	return async (c: Context, next: Next) => {
		const userRole = c.get('role') as string | undefined;

		if (!userRole) {
			return c.json(
				{ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
				401,
			);
		}

		const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
		const minRequired = Math.min(...roles.map((r) => ROLE_HIERARCHY[r] ?? Infinity));

		if (userLevel < minRequired) {
			return c.json(
				{ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
				403,
			);
		}

		await next();
	};
}
