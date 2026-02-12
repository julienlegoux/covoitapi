/**
 * @module result-response.util
 * Bridges the Result pattern with Hono HTTP responses.
 * Converts a Result<T, E> into a standardized JSON API response,
 * mapping error codes to HTTP status codes via the error registry.
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Result } from '../types/result.js';
import { getHttpStatus } from '../../errors/error-registry.js';
import type { ApiResponse } from '../types/index.js';

/** Minimal error shape required for HTTP response mapping. */
interface ErrorWithCode {
	code: string;
	message: string;
}

/**
 * Converts a Result into a Hono JSON response.
 * - On success: returns `{ success: true, data: value }` with the given status code.
 * - On error: returns `{ success: false, error: { code, message } }` with the
 *   HTTP status from the error registry.
 *
 * @template T - The success value type.
 * @template E - The error type (must have code and message).
 * @param c - The Hono request context.
 * @param result - The Result to convert.
 * @param successStatus - HTTP status code for success (200 or 201). Defaults to 200.
 * @returns A Hono Response object.
 */
export function resultToResponse<T, E extends ErrorWithCode>(
	c: Context,
	result: Result<T, E>,
	successStatus: 200 | 201 = 200,
): Response {
	if (result.success) {
		const response: ApiResponse<T> = {
			success: true,
			data: result.value,
		};
		return c.json(response, successStatus);
	}

	// Map the error code to the appropriate HTTP status via the error registry
	const httpStatus = getHttpStatus(result.error.code) as ContentfulStatusCode;
	const response: ApiResponse = {
		success: false,
		error: {
			code: result.error.code,
			message: result.error.message,
		},
	};
	return c.json(response, httpStatus);
}
