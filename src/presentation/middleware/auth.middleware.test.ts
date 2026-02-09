import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context, Next } from 'hono';
import { container } from 'tsyringe';
import { authMiddleware } from './auth.middleware.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { TokenExpiredError, TokenInvalidError, TokenMalformedError } from '../../lib/errors/jwt.errors.js';

function createMockContext(token?: string) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const setMock = vi.fn();
	return {
		req: {
			header: vi.fn((name: string) => (name === 'x-auth-token' ? token : undefined)),
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

describe('authMiddleware', () => {
	let mockJwtService: ReturnType<typeof createMockJwtService>;
	let mockNext: Next;

	beforeEach(() => {
		container.clearInstances();
		mockJwtService = createMockJwtService();
		container.register(TOKENS.JwtService, { useValue: mockJwtService });
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
});
