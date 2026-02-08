import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { JwtService } from '../../domain/services/jwt.service.js';
import { container } from '../../lib/shared/di/container.js';
import { getHttpStatus } from '../../infrastructure/errors/error-registry.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';

export async function authMiddleware(c: Context, next: Next): Promise<Response | undefined> {
	const token = c.req.header('x-auth-token');

	if (!token) {
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

	const jwtService = container.resolve<JwtService>(TOKENS.JwtService);
	const result = await jwtService.verify(token);

	if (result.success) {
		c.set('userId', result.value.userId);
		c.set('role', result.value.role ?? 'USER');
		await next();
		return;
	}

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
}
