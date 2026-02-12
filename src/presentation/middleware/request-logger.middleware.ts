/**
 * @module RequestLoggerMiddleware
 * Request/response logging middleware for the Hono request pipeline.
 *
 * Generates a unique request ID (UUID v4) for each incoming request and logs
 * both the incoming request and outgoing response with timing information.
 * The request ID is also set as the `X-Request-Id` response header for
 * client-side correlation and debugging.
 *
 * Uses AsyncLocalStorage-based request context (`runWithContext`) to make the
 * request ID and start time available to all downstream code within the same
 * async execution chain.
 *
 * **Pipeline position:** Should be registered early (typically first middleware)
 * to capture timing for the full request lifecycle.
 *
 * **Context set:**
 * - Response header `X-Request-Id` (UUID)
 * - AsyncLocalStorage context: `{ requestId, startTime }`
 *
 * **Log entries:**
 * - "Request received" -- method, path, query params, user-agent
 * - "Response sent" -- method, path, status code, duration in ms
 */
import { randomUUID } from 'node:crypto';
import type { Context, Next } from 'hono';
import { logger } from '../../lib/logging/logger.js';
import { getContext, runWithContext } from '../../lib/context/request-context.js';

/**
 * Hono middleware that logs incoming requests and outgoing responses
 * with a unique correlation ID and request duration.
 *
 * @param c - Hono request context
 * @param next - Next middleware/handler in the chain
 */
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
