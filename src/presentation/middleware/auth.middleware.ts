import type { Context, Next } from 'hono';
import type { JwtService } from '../../domain/services/jwt.service.js';
import { container } from '../../infrastructure/di/container.js';
import { TOKENS } from '../../infrastructure/di/tokens.js';

export async function authMiddleware(c: Context, next: Next): Promise<Response | void> {
	const token = c.req.header('x-auth-token');

	if (!token) {
		return c.json(
			{
				success: false,
				error: {
					code: 'MISSING_TOKEN',
					message: 'Authentication token is required',
				},
			},
			401,
		);
	}

	const jwtService = container.resolve<JwtService>(TOKENS.JwtService);
	const payload = await jwtService.verify(token);

	if (!payload) {
		return c.json(
			{
				success: false,
				error: {
					code: 'INVALID_TOKEN',
					message: 'Invalid or expired token',
				},
			},
			401,
		);
	}

	c.set('userId', payload.userId);
	await next();
}
