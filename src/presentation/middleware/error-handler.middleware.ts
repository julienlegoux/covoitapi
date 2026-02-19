/**
 * @module ErrorHandler
 * Global error handler for the Hono application.
 *
 * Registered via `app.onError()` (NOT as middleware) because Hono's internal
 * compose function intercepts errors at each dispatch level before they can
 * reach middleware try/catch blocks.
 *
 * Handles three error categories:
 * 1. **ZodError** (validation) -- 400 with field-level details
 * 2. **DomainError** (business logic) -- mapped HTTP status from error registry
 * 3. **Unknown errors** -- 500 INTERNAL_ERROR (logged, message hidden from client)
 *
 * **Response shape:** `{ success: false, error: { code, message, details? } }`
 */
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { DomainError } from '../../lib/errors/domain.errors.js';
import { getHttpStatus, isErrorCode } from '../../lib/errors/error-registry.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import type { ErrorResponse } from '../../lib/errors/error.types.js';

/**
 * Duck-type check for ZodError compatible with Zod v4.
 * Zod v4 builds ZodError via `$constructor`, so `instanceof ZodError`
 * is unreliable across ESM/CJS boundaries.
 */
function isZodError(error: unknown): error is { issues: { path: (string | number)[]; message: string }[] } {
	if (typeof error !== 'object' || error === null) return false;
	const candidate = error as Record<string, unknown>;
	return candidate.name === 'ZodError' && Array.isArray(candidate.issues);
}

/**
 * Creates a Hono `onError` handler that converts thrown errors into
 * structured JSON error responses.
 *
 * @param logger - Logger instance for logging unexpected errors
 * @returns Hono error handler function for use with `app.onError()`
 */
export function createErrorHandler(logger: Logger) {
	return (error: Error, c: Context): Response => {
		const response = buildErrorResponse(error, logger);
		const status = getStatusCode(error);
		return c.json(response, status as ContentfulStatusCode);
	};
}

/**
 * Builds a structured ErrorResponse from a caught error.
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
