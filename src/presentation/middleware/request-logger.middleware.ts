import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';
import { logger } from '../../lib/logging/logger.js';
import { getContext, runWithContext } from '../../lib/context/request-context.js';

export async function requestLogger(c: Context, next: Next): Promise<void> {
	const requestId = randomUUID();
	const startTime = performance.now();

	// Set response header for client correlation
	c.header('X-Request-Id', requestId);

	await runWithContext({ requestId, startTime }, async () => {
		// Log incoming request
		logger.info('Request received', {
			method: c.req.method,
			path: c.req.path,
			query: c.req.query(),
			userAgent: c.req.header('user-agent'),
		});

		// Execute the handler
		await next();

		// Calculate duration
		const ctx = getContext();
		const duration = ctx ? performance.now() - ctx.startTime : 0;

		// Log response
		logger.info('Response sent', {
			method: c.req.method,
			path: c.req.path,
			status: c.res.status,
			durationMs: Math.round(duration),
		});
	});
}
