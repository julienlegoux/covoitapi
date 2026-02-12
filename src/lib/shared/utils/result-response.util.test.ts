/**
 * @module ResultToResponseTests
 *
 * Test suite for the resultToResponse() utility that bridges the Result<T, E>
 * monad to Hono HTTP JSON responses. Verifies that success Results produce the
 * correct HTTP status and { success, data } body, that error Results produce
 * { success, error } with the appropriate HTTP status resolved from the error
 * registry, and that unknown error codes fall back to HTTP 500.
 */
import { describe, it, expect, vi } from 'vitest';
import type { Context } from 'hono';
import { resultToResponse } from './result-response.util.js';
import { ok, err } from '../types/result.js';

function createMockContext() {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	return {
		json: jsonMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

/** Tests for converting Result values into Hono JSON responses with proper HTTP status codes. */
describe('resultToResponse()', () => {
	/** Validates that a success Result returns HTTP 200 with the data payload by default. */
	it('should return 200 with data on success (default)', () => {
		const ctx = createMockContext();
		const result = ok({ userId: 'user-123', token: 'jwt-token' });

		resultToResponse(ctx, result);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(200);
		expect(response).toEqual({
			success: true,
			data: { userId: 'user-123', token: 'jwt-token' },
		});
	});

	/** Validates that an explicit success status code (201 Created) is honored. */
	it('should return 201 with data on success (explicit)', () => {
		const ctx = createMockContext();
		const result = ok({ id: 'new-resource-123' });

		resultToResponse(ctx, result, 201);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(201);
		expect(response).toEqual({
			success: true,
			data: { id: 'new-resource-123' },
		});
	});

	/** Validates that a failure Result produces a JSON body with the error code and message. */
	it('should return error code and message on failure', () => {
		const ctx = createMockContext();
		const result = err({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

		resultToResponse(ctx, result);

		const [response] = ctx._getJsonCall();
		expect(response).toEqual({
			success: false,
			error: {
				code: 'INVALID_CREDENTIALS',
				message: 'Invalid email or password',
			},
		});
	});

	/** Validates that INVALID_CREDENTIALS resolves to HTTP 401 via the error registry. */
	it('should use correct HTTP status from error registry', () => {
		const ctx = createMockContext();
		const result = err({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(401);
	});

	/** Validates that USER_ALREADY_EXISTS resolves to HTTP 409 Conflict. */
	it('should return 409 for USER_ALREADY_EXISTS', () => {
		const ctx = createMockContext();
		const result = err({ code: 'USER_ALREADY_EXISTS', message: 'User exists' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(409);
	});

	/** Validates that USER_NOT_FOUND resolves to HTTP 404 Not Found. */
	it('should return 404 for USER_NOT_FOUND', () => {
		const ctx = createMockContext();
		const result = err({ code: 'USER_NOT_FOUND', message: 'User not found' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(404);
	});

	/** Validates that an unregistered error code defaults to HTTP 500 Internal Server Error. */
	it('should return 500 for unknown error codes', () => {
		const ctx = createMockContext();
		const result = err({ code: 'UNKNOWN_ERROR', message: 'Something happened' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(500);
	});
});
