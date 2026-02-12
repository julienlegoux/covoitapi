/**
 * @module hono-jwt.service.test
 * Unit tests for {@link HonoJwtService}.
 * Mocks the hono/jwt sign and verify functions to test token creation,
 * payload validation, error classification (expired, malformed, invalid),
 * and expiration calculation for different duration formats (h, d, m).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TokenExpiredError, TokenInvalidError, TokenMalformedError, TokenSigningError } from '../../lib/errors/jwt.errors.js';

// Mock hono/jwt to isolate the service logic from actual cryptographic operations
const mockSign = vi.fn();
const mockVerify = vi.fn();

vi.mock('hono/jwt', () => ({
	sign: (...args: unknown[]) => mockSign(...args),
	verify: (...args: unknown[]) => mockVerify(...args),
}));

import { HonoJwtService } from './hono-jwt.service.js';
import { createMockLogger } from '../../../tests/setup.js';

// Tests for HonoJwtService with mocked hono/jwt functions
describe('HonoJwtService', () => {
	let jwtService: HonoJwtService;
	const originalEnv = process.env;

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
		process.env.JWT_SECRET = 'test-secret';
		process.env.JWT_EXPIRES_IN = '24h';
		jwtService = new HonoJwtService(createMockLogger() as any);
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	// Verifies constructor throws when JWT_SECRET is missing and defaults JWT_EXPIRES_IN
	describe('constructor', () => {
		it('should throw when JWT_SECRET is missing', () => {
			process.env.JWT_SECRET = '';
			expect(() => new HonoJwtService(createMockLogger() as any)).toThrow('JWT_SECRET environment variable is required');
		});

		it('should default JWT_EXPIRES_IN to 24h', () => {
			delete process.env.JWT_EXPIRES_IN;
			expect(() => new HonoJwtService(createMockLogger() as any)).not.toThrow();
		});
	});

	// Verifies sign() delegates to hono sign with correct payload, secret, and algorithm
	describe('sign()', () => {
		it('should return ok with the signed token', async () => {
			mockSign.mockResolvedValue('signed-token');

			const result = await jwtService.sign({ userId: 'user-123', role: 'USER' });

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBe('signed-token');
			}
		});

		it('should pass payload with exp and secret to hono sign', async () => {
			mockSign.mockResolvedValue('token');
			const now = Math.floor(Date.now() / 1000);

			await jwtService.sign({ userId: 'user-123', role: 'ADMIN' });

			expect(mockSign).toHaveBeenCalledWith(
				expect.objectContaining({ userId: 'user-123', role: 'ADMIN', exp: expect.any(Number) }),
				'test-secret',
				'HS256',
			);
			const passedExp = mockSign.mock.calls[0][0].exp;
			expect(passedExp).toBeGreaterThanOrEqual(now + 24 * 60 * 60 - 1);
			expect(passedExp).toBeLessThanOrEqual(now + 24 * 60 * 60 + 1);
		});

		it('should return TokenSigningError when hono sign throws', async () => {
			mockSign.mockRejectedValue(new Error('signing failed'));

			const result = await jwtService.sign({ userId: 'user-123', role: 'USER' });

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenSigningError);
			}
		});
	});

	// Verifies verify() extracts payload, validates userId, and classifies JWT errors
	describe('verify()', () => {
		it('should return payload with userId and role', async () => {
			mockVerify.mockResolvedValue({ userId: 'user-789', role: 'ADMIN' });

			const result = await jwtService.verify('valid-token');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toEqual({ userId: 'user-789', role: 'ADMIN' });
			}
		});

		it('should default role to USER when missing from decoded token', async () => {
			mockVerify.mockResolvedValue({ userId: 'user-123' });

			const result = await jwtService.verify('token');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.role).toBe('USER');
			}
		});

		it('should return TokenInvalidError when userId is missing', async () => {
			mockVerify.mockResolvedValue({ role: 'USER' });

			const result = await jwtService.verify('token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should return TokenInvalidError when userId is not a string', async () => {
			mockVerify.mockResolvedValue({ userId: 123, role: 'USER' });

			const result = await jwtService.verify('token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should return TokenExpiredError for expired token errors', async () => {
			mockVerify.mockRejectedValue(new Error('token expired'));

			const result = await jwtService.verify('expired-token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenExpiredError);
			}
		});

		it('should return TokenMalformedError for malformed token errors', async () => {
			mockVerify.mockRejectedValue(new Error('malformed token'));

			const result = await jwtService.verify('bad-token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenMalformedError);
			}
		});

		it('should return TokenMalformedError for invalid token errors', async () => {
			mockVerify.mockRejectedValue(new Error('invalid token'));

			const result = await jwtService.verify('bad-token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenMalformedError);
			}
		});

		it('should return TokenInvalidError for unknown errors', async () => {
			mockVerify.mockRejectedValue(new Error('something unexpected'));

			const result = await jwtService.verify('token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should handle non-Error thrown values', async () => {
			mockVerify.mockRejectedValue('string error');

			const result = await jwtService.verify('token');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should pass token and secret to hono verify', async () => {
			mockVerify.mockResolvedValue({ userId: 'u', role: 'USER' });

			await jwtService.verify('my-token');

			expect(mockVerify).toHaveBeenCalledWith('my-token', 'test-secret', 'HS256');
		});
	});

	// Verifies expiration calculation for hours, days, minutes, and invalid format fallback
	describe('calculateExpiration()', () => {
		it('should calculate hours correctly', async () => {
			process.env.JWT_EXPIRES_IN = '2h';
			const service = new HonoJwtService(createMockLogger() as any);
			mockSign.mockResolvedValue('token');
			const now = Math.floor(Date.now() / 1000);

			await service.sign({ userId: 'u', role: 'USER' });

			const exp = mockSign.mock.calls[0][0].exp;
			expect(exp).toBeGreaterThanOrEqual(now + 2 * 3600 - 1);
			expect(exp).toBeLessThanOrEqual(now + 2 * 3600 + 1);
		});

		it('should calculate days correctly', async () => {
			process.env.JWT_EXPIRES_IN = '7d';
			const service = new HonoJwtService(createMockLogger() as any);
			mockSign.mockResolvedValue('token');
			const now = Math.floor(Date.now() / 1000);

			await service.sign({ userId: 'u', role: 'USER' });

			const exp = mockSign.mock.calls[0][0].exp;
			expect(exp).toBeGreaterThanOrEqual(now + 7 * 86400 - 1);
			expect(exp).toBeLessThanOrEqual(now + 7 * 86400 + 1);
		});

		it('should calculate minutes correctly', async () => {
			process.env.JWT_EXPIRES_IN = '30m';
			const service = new HonoJwtService(createMockLogger() as any);
			mockSign.mockResolvedValue('token');
			const now = Math.floor(Date.now() / 1000);

			await service.sign({ userId: 'u', role: 'USER' });

			const exp = mockSign.mock.calls[0][0].exp;
			expect(exp).toBeGreaterThanOrEqual(now + 30 * 60 - 1);
			expect(exp).toBeLessThanOrEqual(now + 30 * 60 + 1);
		});

		it('should default to 24h for invalid format', async () => {
			process.env.JWT_EXPIRES_IN = 'invalid';
			const service = new HonoJwtService(createMockLogger() as any);
			mockSign.mockResolvedValue('token');
			const now = Math.floor(Date.now() / 1000);

			await service.sign({ userId: 'u', role: 'USER' });

			const exp = mockSign.mock.calls[0][0].exp;
			expect(exp).toBeGreaterThanOrEqual(now + 86400 - 1);
			expect(exp).toBeLessThanOrEqual(now + 86400 + 1);
		});
	});
});
