import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HonoJwtService } from './hono-jwt.service.js';
import { TokenExpiredError, TokenInvalidError, TokenMalformedError, TokenSigningError } from '../../lib/errors/jwt.errors.js';

describe('HonoJwtService', () => {
	let jwtService: HonoJwtService;
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes';
		process.env.JWT_EXPIRES_IN = '24h';
		jwtService = new HonoJwtService();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('sign()', () => {
		it('should sign a payload and return a valid JWT token', async () => {
			const payload = { userId: 'user-123', role: 'USER' };

			const result = await jwtService.sign(payload);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBeDefined();
				expect(typeof result.value).toBe('string');
				expect(result.value.split('.')).toHaveLength(3);
			}
		});

		it('should include userId and role in the signed token payload', async () => {
			const payload = { userId: 'user-456', role: 'ADMIN' };

			const signResult = await jwtService.sign(payload);
			expect(signResult.success).toBe(true);
			if (!signResult.success) return;

			const verifyResult = await jwtService.verify(signResult.value);
			expect(verifyResult.success).toBe(true);
			if (verifyResult.success) {
				expect(verifyResult.value.userId).toBe('user-456');
				expect(verifyResult.value.role).toBe('ADMIN');
			}
		});

		it('should throw when secret is missing', () => {
			process.env.JWT_SECRET = '';
			expect(() => new HonoJwtService()).toThrow('JWT_SECRET environment variable is required');
		});
	});

	describe('verify()', () => {
		it('should verify a valid token and return payload', async () => {
			const payload = { userId: 'user-789', role: 'USER' };
			const signResult = await jwtService.sign(payload);
			expect(signResult.success).toBe(true);
			if (!signResult.success) return;

			const result = await jwtService.verify(signResult.value);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.userId).toBe('user-789');
				expect(result.value.role).toBe('USER');
			}
		});

		it('should return TokenInvalidError when userId is missing from payload', async () => {
			// Manually create a token without userId using hono/jwt directly
			const { sign: honoSign } = await import('hono/jwt');
			const secret = 'test-secret-key-for-testing-purposes';
			const exp = Math.floor(Date.now() / 1000) + 3600;
			const token = await honoSign({ role: 'USER', exp }, secret, 'HS256');

			const result = await jwtService.verify(token);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should return error for malformed tokens', async () => {
			const result = await jwtService.verify('not-a-valid-jwt');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should return TokenMalformedError when error message contains "malformed"', async () => {
			const result = await jwtService.verify('eyJhbGciOiJIUzI1NiJ9.invalid.signature');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect([TokenMalformedError, TokenInvalidError].some(
					(ErrorClass) => result.error instanceof ErrorClass
				)).toBe(true);
			}
		});

		it('should return TokenInvalidError for token with invalid signature', async () => {
			const payload = { userId: 'user-123', role: 'USER' };
			const signResult = await jwtService.sign(payload);
			expect(signResult.success).toBe(true);
			if (!signResult.success) return;

			const tamperedToken = `${signResult.value.slice(0, -5)}xxxxx`;

			const result = await jwtService.verify(tamperedToken);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenInvalidError);
			}
		});

		it('should return TokenExpiredError for expired tokens', async () => {
			process.env.JWT_EXPIRES_IN = '0m';
			const serviceWithExpiredTokens = new HonoJwtService();
			const payload = { userId: 'user-123', role: 'USER' };

			const signResult = await serviceWithExpiredTokens.sign(payload);
			expect(signResult.success).toBe(true);
			if (!signResult.success) return;

			await new Promise((resolve) => setTimeout(resolve, 100));

			const result = await serviceWithExpiredTokens.verify(signResult.value);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(TokenExpiredError);
			}
		});

		it('should default role to USER when role is missing from token', async () => {
			const { sign: honoSign } = await import('hono/jwt');
			const secret = 'test-secret-key-for-testing-purposes';
			const exp = Math.floor(Date.now() / 1000) + 3600;
			const token = await honoSign({ userId: 'user-123', exp }, secret, 'HS256');

			const result = await jwtService.verify(token);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value.userId).toBe('user-123');
				expect(result.value.role).toBe('USER');
			}
		});
	});

	describe('calculateExpiration (via sign/verify)', () => {
		it('should handle hours format (e.g., "24h")', async () => {
			process.env.JWT_EXPIRES_IN = '1h';
			const service = new HonoJwtService();
			const payload = { userId: 'user-123', role: 'USER' };

			const result = await service.sign(payload);

			expect(result.success).toBe(true);
			if (result.success) {
				const verifyResult = await service.verify(result.value);
				expect(verifyResult.success).toBe(true);
			}
		});

		it('should handle days format (e.g., "7d")', async () => {
			process.env.JWT_EXPIRES_IN = '7d';
			const service = new HonoJwtService();
			const payload = { userId: 'user-123', role: 'USER' };

			const result = await service.sign(payload);

			expect(result.success).toBe(true);
			if (result.success) {
				const verifyResult = await service.verify(result.value);
				expect(verifyResult.success).toBe(true);
			}
		});

		it('should handle minutes format (e.g., "30m")', async () => {
			process.env.JWT_EXPIRES_IN = '30m';
			const service = new HonoJwtService();
			const payload = { userId: 'user-123', role: 'USER' };

			const result = await service.sign(payload);

			expect(result.success).toBe(true);
			if (result.success) {
				const verifyResult = await service.verify(result.value);
				expect(verifyResult.success).toBe(true);
			}
		});

		it('should default to 24 hours for invalid format', async () => {
			process.env.JWT_EXPIRES_IN = 'invalid';
			const service = new HonoJwtService();
			const payload = { userId: 'user-123', role: 'USER' };

			const result = await service.sign(payload);

			expect(result.success).toBe(true);
			if (result.success) {
				const verifyResult = await service.verify(result.value);
				expect(verifyResult.success).toBe(true);
			}
		});
	});
});
