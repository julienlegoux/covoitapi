/**
 * Unit tests for the requireRole authorization middleware.
 * Verifies the hierarchical role system (USER < DRIVER < ADMIN),
 * including exact role match, higher-role access, insufficient permissions (403),
 * missing role (401), unknown roles, and multi-role argument behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Context, Next } from 'hono';
import { container } from 'tsyringe';
import { requireRole } from './authorization.middleware.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import { createMockLogger } from '../../../tests/setup.js';

function createMockContext(role?: string) {
	const jsonMock = vi.fn((body: unknown, status: number) => ({ body, status }));
	const getMock = vi.fn((key: string) => {
		if (key === 'role') return role;
		return undefined;
	});
	return {
		get: getMock,
		json: jsonMock,
		req: { path: '/test', method: 'GET' },
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & {
		_getJsonCall: () => [unknown, number];
	};
}

function createMockNext(): Next {
	return vi.fn().mockResolvedValue(undefined);
}

// Tests for the role hierarchy and permission enforcement
describe('requireRole', () => {
	beforeEach(() => {
		container.clearInstances();
		container.registerInstance(TOKENS.Logger, createMockLogger());
	});

	it('should return 401 when role is not set in context', async () => {
		const ctx = createMockContext(undefined);
		const next = createMockNext();
		const middleware = requireRole('USER');

		await middleware(ctx, next);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(401);
		expect(response).toEqual({
			success: false,
			error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('should call next() when user has the exact required role', async () => {
		const ctx = createMockContext('USER');
		const next = createMockNext();
		const middleware = requireRole('USER');

		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it('should call next() when user has a higher role than required', async () => {
		const ctx = createMockContext('ADMIN');
		const next = createMockNext();
		const middleware = requireRole('USER');

		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it('should call next() when DRIVER accesses USER-level route', async () => {
		const ctx = createMockContext('DRIVER');
		const next = createMockNext();
		const middleware = requireRole('USER');

		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it('should return 403 when USER tries to access DRIVER-level route', async () => {
		const ctx = createMockContext('USER');
		const next = createMockNext();
		const middleware = requireRole('DRIVER');

		await middleware(ctx, next);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(403);
		expect(response).toEqual({
			success: false,
			error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('should return 403 when USER tries to access ADMIN-level route', async () => {
		const ctx = createMockContext('USER');
		const next = createMockNext();
		const middleware = requireRole('ADMIN');

		await middleware(ctx, next);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(403);
		expect(response).toEqual({
			success: false,
			error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('should return 403 when DRIVER tries to access ADMIN-level route', async () => {
		const ctx = createMockContext('DRIVER');
		const next = createMockNext();
		const middleware = requireRole('ADMIN');

		await middleware(ctx, next);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(403);
		expect(response).toEqual({
			success: false,
			error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('should allow access when user meets minimum of multiple roles', async () => {
		const ctx = createMockContext('DRIVER');
		const next = createMockNext();
		// requireRole('USER', 'DRIVER') means minimum of USER(1), DRIVER(2) = USER(1)
		const middleware = requireRole('USER', 'DRIVER');

		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it('should return 403 for unknown role', async () => {
		const ctx = createMockContext('UNKNOWN');
		const next = createMockNext();
		const middleware = requireRole('USER');

		await middleware(ctx, next);

		const [response, status] = ctx._getJsonCall();
		expect(status).toBe(403);
		expect(response).toEqual({
			success: false,
			error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
		});
		expect(next).not.toHaveBeenCalled();
	});

	it('should call next() when ADMIN accesses DRIVER-level route', async () => {
		const ctx = createMockContext('ADMIN');
		const next = createMockNext();
		const middleware = requireRole('DRIVER');

		await middleware(ctx, next);

		expect(next).toHaveBeenCalled();
	});
});
