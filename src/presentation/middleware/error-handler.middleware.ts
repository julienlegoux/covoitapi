/**
 * @module ErrorHandlerMiddleware
 * Global error-handling middleware for the Hono request pipeline.
 *
 * Wraps the downstream handler chain in a try/catch and converts thrown
 * errors into structured JSON error responses. Handles three error categories:
 *
 * 1. **ZodError** (validation) -- 400 with field-level details
 * 2. **DomainError** (business logic) -- mapped HTTP status from error registry
 * 3. **Unknown errors** -- 500 INTERNAL_ERROR (logged, message hidden from client)
 *
 * **Pipeline position:** Should be registered early (before route handlers)
 * so it catches errors from all downstream middleware and controllers.
 *
 * **Response shape:** `{ success: false, error: { code, message, details? } }`
 */
import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { DomainError } from '../../lib/errors/domain.errors.js';
import { getHttpStatus, isErrorCode } from '../../lib/errors/error-registry.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import type { ErrorResponse } from '../../lib/errors/error.types.js';

/**
 * Duck-type check for ZodError that works across ESM/CJS boundaries.
 * Using `instanceof ZodError` fails when Zod is loaded via both module
 * systems (dual-package hazard), producing two distinct class identities.
 */
function isZodError(error: unknown): error is { issues: { path: (string | number)[]; message: string }[] } {
	return (
		error instanceof Error &&
		error.name === 'ZodError' &&
		Array.isArray((error as unknown as Record<string, unknown>).issues)
	);
}

/**
 * Creates a Hono middleware that catches errors thrown by downstream handlers
 * and converts them to standardized JSON error responses.
 *
 * @param logger - Logger instance for logging unexpected errors
 * @returns Hono middleware function
 */
export function createErrorHandler(logger: Logger) {
	return async (c: Context, next: Next): Promise<Response | undefined> => {
		try {
			await next();
		} catch (error) {
			const response = buildErrorResponse(error, logger);
			const status = getStatusCode(error);
			return c.json(response, status as ContentfulStatusCode);
		}
	};
}

/**
 * Builds a structured ErrorResponse from a caught error.
 * - ZodError: extracts per-field validation messages into a `details` map
 * - DomainError: uses the error's code and message directly
 * - Unknown: logs the error and returns a generic INTERNAL_ERROR
 *
 * @param error - The caught error (any type)
 * @param logger - Logger instance for logging unexpected errors
 * @returns Structured error response object
 */
function buildErrorResponse(error: unknown, logger: Logger): ErrorResponse {
	if (isZodError(error)) {
		const details: Record<string, string[]> = {};
		for (const issue of error.issues) {
			const path = issue.path.join('.');
			if (!details[path]) {
				details[path] = [];
			}
			details[path].push(issue.message);
		}
		return {
			success: false,
			error: {
				code: 'VALIDATION_ERROR',
				message: 'Validation failed',
				details,
			},
		};
	}

	if (error instanceof DomainError) {
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
			},
		};
	}

	logger.error('Unexpected error', error instanceof Error ? error : null);
	return {
		success: false,
		error: {
			code: 'INTERNAL_ERROR',
			message: 'An unexpected error occurred',
		},
	};
}

/**
 * Determines the HTTP status code for a given error type.
 * - ZodError: 400 (Bad Request)
 * - DomainError: looked up from the error registry, or 400 if unknown
 * - Other: 500 (Internal Server Error)
 *
 * @param error - The caught error (any type)
 * @returns HTTP status code number
 */
function getStatusCode(error: unknown): number {
	if (isZodError(error)) {
		return 400;
	}

	if (error instanceof DomainError) {
		return isErrorCode(error.code) ? getHttpStatus(error.code) : 400;
	}

	return 500;
}
