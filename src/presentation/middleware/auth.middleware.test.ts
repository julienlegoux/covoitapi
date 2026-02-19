/**
 * Unit tests for the createAuthMiddleware factory.
 * Verifies JWT token extraction from x-auth-token header, JwtService delegation,
 * context population (userId, role), and error responses for missing/expired/
 * invalid/malformed tokens.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { createAuthMiddleware } from './auth.middleware.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { TokenExpiredError, TokenInvalidError, TokenMalformedError } from '../../lib/errors/jwt.errors.js';
import { createMockLogger } from '../../../tests/setup.js';

function createMockContext(token?: string, via: 'x-auth-token' | 'bearer' = 'x-auth-token') {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const setMock = vi.fn();
	return {
		req: {
			header: vi.fn((name: string) => {
				if (via === 'bearer' && name === 'Authorization' && token) return `Bearer ${token}`;
				if (via === 'x-auth-token' && name === 'x-auth-token') return token;
				return undefined;
			}),
			path: '/test',
			method: 'GET',
		},
		json: jsonMock,
		set: setMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
		_getSetCalls: () => setMock.mock.calls,
	} as unknown as Context & {
		_getJsonCall: () => [unknown, number];
		_getSetCalls: () => Array<[string, unknown]>;
	};
}

function createMockJwtService() {
	return {
		sign: vi.fn(),
		verify: vi.fn(),
	};
}

// Tests for token validation, context population, and JWT error scenarios
describe('authMiddleware', () => {
	let mockJwtService: ReturnType<typeof createMockJwtService>;
	let mockLogger: ReturnType<typeof createMockLogger>;
	let authMiddleware: ReturnType<typeof createAuthMiddleware>;
	let mockNext: Next;

	beforeEach(() => {
		mockJwtService = createMockJwtService();
		mockLogger = createMockLogger();
		authMiddleware = createAuthMiddleware(mockJwtService, mockLogger);
		mockNext = vi.fn().mockResolvedValue(undefined);
	});

	it('should return 401 when x-auth-token header is missing', async () => {
		const ctx = createMockContext(undefined);

		await authMiddleware(ctx, mockNext);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(401);
		expect(response).toEqual({
			success: false,
			error: {
				code: 'UNAUTHORIZED',
				message: 'Authentication token is required',
			},
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should call jwtService.verify with token', async () => {
		mockJwtService.verify.mockResolvedValue(ok({ userId: 'user-123' }));
		const ctx = createMockContext('valid-token');

		await authMiddleware(ctx, mockNext);

		expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
	});

	it('should set userId in context on successful verification', async () => {
		mockJwtService.verify.mockResolvedValue(ok({ userId: 'user-123' }));
		const ctx = createMockContext('valid-token');

		await authMiddleware(ctx, mockNext);

		expect(ctx._getSetCalls()).toContainEqual(['userId', 'user-123']);
	});

	it('should call next() on successful verification', async () => {
		mockJwtService.verify.mockResolvedValue(ok({ userId: 'user-123' }));
		const ctx = createMockContext('valid-token');

		await authMiddleware(ctx, mockNext);

		expect(mockNext).toHaveBeenCalled();
	});

	it('should return error response on TokenExpiredError', async () => {
		mockJwtService.verify.mockResolvedValue(err(new TokenExpiredError()));
		const ctx = createMockContext('expired-token');

		await authMiddleware(ctx, mockNext);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(401);
		expect(response).toEqual({
			success: false,
			error: {
				code: 'TOKEN_EXPIRED',
				message: 'Token has expired',
			},
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return error response on TokenInvalidError', async () => {
		mockJwtService.verify.mockResolvedValue(err(new TokenInvalidError()));
		const ctx = createMockContext('invalid-token');

		await authMiddleware(ctx, mockNext);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(401);
		expect(response).toEqual({
			success: false,
			error: {
				code: 'TOKEN_INVALID',
				message: 'Token is invalid',
			},
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should return error response on TokenMalformedError', async () => {
		mockJwtService.verify.mockResolvedValue(err(new TokenMalformedError()));
		const ctx = createMockContext('malformed-token');

		await authMiddleware(ctx, mockNext);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(400);
		expect(response).toEqual({
			success: false,
			error: {
				code: 'TOKEN_MALFORMED',
				message: 'Token is malformed',
			},
		});
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('should accept Authorization Bearer header', async () => {
		mockJwtService.verify.mockResolvedValue(ok({ userId: 'user-456', role: 'USER' }));
		const ctx = createMockContext('bearer-token', 'bearer');

		await authMiddleware(ctx, mockNext);

		expect(mockJwtService.verify).toHaveBeenCalledWith('bearer-token');
		expect(ctx._getSetCalls()).toContainEqual(['userId', 'user-456']);
		expect(mockNext).toHaveBeenCalled();
	});

	it('should prefer Authorization Bearer over x-auth-token', async () => {
		mockJwtService.verify.mockResolvedValue(ok({ userId: 'user-789', role: 'USER' }));
		const jsonMock = vi.fn((body, status) => ({ body, status }));
		const setMock = vi.fn();
		const ctx = {
			req: {
				header: vi.fn((name: string) => {
					if (name === 'Authorization') return 'Bearer bearer-token';
					if (name === 'x-auth-token') return 'custom-token';
					return undefined;
				}),
				path: '/test',
				method: 'GET',
			},
			json: jsonMock,
			set: setMock,
		} as unknown as Context;

		await authMiddleware(ctx, mockNext);

		expect(mockJwtService.verify).toHaveBeenCalledWith('bearer-token');
	});
});
