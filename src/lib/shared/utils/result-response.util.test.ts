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

describe('resultToResponse()', () => {
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

	it('should use correct HTTP status from error registry', () => {
		const ctx = createMockContext();
		const result = err({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(401);
	});

	it('should return 409 for USER_ALREADY_EXISTS', () => {
		const ctx = createMockContext();
		const result = err({ code: 'USER_ALREADY_EXISTS', message: 'User exists' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(409);
	});

	it('should return 404 for USER_NOT_FOUND', () => {
		const ctx = createMockContext();
		const result = err({ code: 'USER_NOT_FOUND', message: 'User not found' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(404);
	});

	it('should return 500 for unknown error codes', () => {
		const ctx = createMockContext();
		const result = err({ code: 'UNKNOWN_ERROR', message: 'Something happened' });

		resultToResponse(ctx, result);

		const [, status] = ctx._getJsonCall();
		expect(status).toBe(500);
	});
});
