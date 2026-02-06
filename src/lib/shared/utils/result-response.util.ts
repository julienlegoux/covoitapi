import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { Result } from '../types/result.js';
import { getHttpStatus } from '../../../infrastructure/errors/error-registry.js';
import type { ApiResponse } from '../types/index.js';

interface ErrorWithCode {
	code: string;
	message: string;
}

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
