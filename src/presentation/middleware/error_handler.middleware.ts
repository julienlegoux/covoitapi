import type { Context, Next } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { ApplicationError } from '../../application/errors/application.errors.js';
import { DomainError } from '../../domain/errors/domain.errors.js';
import { ErrorCodes } from '../../infrastructure/errors/error-registry.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { getRequestId } from '../../lib/context/request-context.js';

type ErrorResponse = {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, string[]>;
		requestId?: string;
	};
};

export async function errorHandler(c: Context, next: Next): Promise<Response | void> {
	try {
		await next();
	} catch (error) {
		const response = buildErrorResponse(error);
		const status = getStatusCode(error);

		// Log the error
		logError(error, status);

		return c.json(response, status as ContentfulStatusCode);
	}
}

function logError(error: unknown, status: number): void {
	const isExpectedError =
		error instanceof DomainError || error instanceof ApplicationError || error instanceof ZodError;

	if (isExpectedError) {
		// Expected errors logged as warnings
		logger.warn('Request failed', {
			errorType: error.constructor.name,
			code: error instanceof ZodError ? 'VALIDATION_ERROR' : (error as DomainError).code,
			status,
		});
	} else {
		// Unexpected errors logged as errors with full details
		logger.error('Unexpected error occurred', error instanceof Error ? error : null, { status });
	}
}

function buildErrorResponse(error: unknown): ErrorResponse {
	const requestId = getRequestId();

	if (error instanceof ZodError) {
		const details: Record<string, string[]> = {};
		for (const issue of error.issues) {
			const path = issue.path.join('.') || 'root';
			if (!details[path]) {
				details[path] = [];
			}
			details[path].push(issue.message);
		}
		return {
			success: false,
			error: {
				code: ErrorCodes.VALIDATION_ERROR.code,
				message: 'Validation failed',
				details,
				requestId,
			},
		};
	}

	if (error instanceof DomainError) {
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				requestId,
			},
		};
	}

	if (error instanceof ApplicationError) {
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				requestId,
			},
		};
	}

	return {
		success: false,
		error: {
			code: ErrorCodes.INTERNAL_ERROR.code,
			message: 'An unexpected error occurred',
			requestId,
		},
	};
}

function getStatusCode(error: unknown): number {
	if (error instanceof ZodError) {
		return ErrorCodes.VALIDATION_ERROR.httpStatus;
	}

	if (error instanceof DomainError) {
		return error.httpStatus;
	}

	if (error instanceof ApplicationError) {
		return error.httpStatus;
	}

	return ErrorCodes.INTERNAL_ERROR.httpStatus;
}
