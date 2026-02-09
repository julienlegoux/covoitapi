import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { DomainError } from '../../lib/errors/domain.errors.js';
import { getHttpStatus, isErrorCode } from '../../lib/errors/error-registry.js';
import { logger } from '../../lib/logging/logger.js';
import type { ErrorResponse } from '../../lib/errors/error.types.js';

export async function errorHandler(c: Context, next: Next): Promise<Response | undefined> {
	try {
		await next();
	} catch (error) {
		const response = buildErrorResponse(error);
		const status = getStatusCode(error);
		return c.json(response, status as ContentfulStatusCode);
	}
}

function buildErrorResponse(error: unknown): ErrorResponse {
	if (error instanceof ZodError) {
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

function getStatusCode(error: unknown): number {
	if (error instanceof ZodError) {
		return 400;
	}

	if (error instanceof DomainError) {
		return isErrorCode(error.code) ? getHttpStatus(error.code) : 400;
	}

	return 500;
}
