import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ApiResponse } from '../types/index.js';

export function successResponse<T>(c: Context, data: T, status: 200 | 201 = 200): Response {
	const response: ApiResponse<T> = {
		success: true,
		data,
	};
	return c.json(response, status);
}

export function errorResponse(
	c: Context,
	code: string,
	message: string,
	status: ContentfulStatusCode = 400,
	details?: Record<string, string[]>,
): Response {
	const response: ApiResponse = {
		success: false,
		error: {
			code,
			message,
			...(details && { details }),
		},
	};
	return c.json(response, status);
}
