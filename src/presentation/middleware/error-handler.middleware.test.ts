/**
 * Unit tests for the createErrorHandler onError handler.
 * Verifies correct handling of three error categories:
 * - ZodError: 400 with per-field details, nested paths, multiple errors
 * - DomainError: mapped HTTP status codes (409, 401, 404, 400)
 * - Unknown errors: 500 INTERNAL_ERROR with logging
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Context } from 'hono';
import { type ZodError, z } from 'zod';
import { createErrorHandler } from './error-handler.middleware.js';
import { DomainError, UserAlreadyExistsError, InvalidCredentialsError, UserNotFoundError } from '../../lib/errors/domain.errors.js';
import { createMockLogger } from '../../../tests/setup.js';

function createMockContext() {
	const jsonMock = vi.fn();
	return {
		json: jsonMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	};
}

describe('errorHandler onError handler', () => {
	let mockLogger: ReturnType<typeof createMockLogger>;
	let errorHandler: ReturnType<typeof createErrorHandler>;

	beforeEach(() => {
		mockLogger = createMockLogger();
		errorHandler = createErrorHandler(mockLogger);
	});

	// Zod validation errors: 400 status with field-level details
	describe('ZodError handling', () => {
		it('should return 400 with VALIDATION_ERROR code', () => {
			const schema = z.object({ email: z.string().email() });
			let zodError: ZodError | undefined;
			try {
				schema.parse({ email: 'invalid' });
			} catch (e) {
				zodError = e as ZodError;
			}

			const ctx = createMockContext();
			errorHandler(zodError as unknown as Error, ctx as unknown as Context);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(400);
			expect(response.success).toBe(false);
			expect(response.error.code).toBe('VALIDATION_ERROR');
			expect(response.error.message).toBe('Validation failed');
		});

		it('should format Zod issues into details object', () => {
			const schema = z.object({ email: z.string().email() });
			let zodError: ZodError | undefined;
			try {
				schema.parse({ email: 'invalid' });
			} catch (e) {
				zodError = e as ZodError;
			}

			const ctx = createMockContext();
			errorHandler(zodError as unknown as Error, ctx as unknown as Context);

			const [response] = ctx._getJsonCall();
			expect(response.error.details).toBeDefined();
			expect(response.error.details.email).toBeInstanceOf(Array);
			expect(response.error.details.email.length).toBeGreaterThan(0);
		});

		it('should handle multiple validation errors on same field', () => {
			const schema = z.object({
				password: z.string().min(8).regex(/[A-Z]/, 'Must contain uppercase'),
			});
			let zodError: ZodError | undefined;
			try {
				schema.parse({ password: 'ab' });
			} catch (e) {
				zodError = e as ZodError;
			}

			const ctx = createMockContext();
			errorHandler(zodError as unknown as Error, ctx as unknown as Context);

			const [response] = ctx._getJsonCall();
			expect(response.error.details.password.length).toBeGreaterThanOrEqual(2);
		});

		it('should handle nested path validation errors', () => {
			const schema = z.object({
				user: z.object({
					profile: z.object({
						email: z.string().email(),
					}),
				}),
			});
			let zodError: ZodError | undefined;
			try {
				schema.parse({ user: { profile: { email: 'invalid' } } });
			} catch (e) {
				zodError = e as ZodError;
			}

			const ctx = createMockContext();
			errorHandler(zodError as unknown as Error, ctx as unknown as Context);

			const [response] = ctx._getJsonCall();
			expect(response.error.details['user.profile.email']).toBeDefined();
		});
	});

	// Domain errors: mapped to appropriate HTTP status via error registry
	describe('DomainError handling', () => {
		it('should return 409 for USER_ALREADY_EXISTS', () => {
			const error = new UserAlreadyExistsError('test@example.com');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(409);
			expect(response.success).toBe(false);
			expect(response.error.code).toBe('USER_ALREADY_EXISTS');
		});

		it('should return 401 for INVALID_CREDENTIALS', () => {
			const error = new InvalidCredentialsError();
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(401);
			expect(response.success).toBe(false);
			expect(response.error.code).toBe('INVALID_CREDENTIALS');
		});

		it('should return 404 for USER_NOT_FOUND', () => {
			const error = new UserNotFoundError('user-123');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(404);
			expect(response.success).toBe(false);
			expect(response.error.code).toBe('USER_NOT_FOUND');
		});

		it('should include error code and message in response', () => {
			const error = new UserNotFoundError('user-123');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response] = ctx._getJsonCall();
			expect(response.error.code).toBe('USER_NOT_FOUND');
			expect(response.error.message).toBe('User not found: user-123');
		});

		it('should return 400 for generic DomainError', () => {
			const error = new DomainError('Some domain error', 'UNKNOWN_DOMAIN_ERROR');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(400);
			expect(response.error.code).toBe('UNKNOWN_DOMAIN_ERROR');
		});
	});

	// Unexpected errors: 500 INTERNAL_ERROR with error logging
	describe('Unknown error handling', () => {
		it('should return 500 for unexpected errors', () => {
			const error = new Error('Unexpected database connection failed');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [, status] = ctx._getJsonCall();
			expect(status).toBe(500);
		});

		it('should return INTERNAL_ERROR code', () => {
			const error = new Error('Something went wrong');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			const [response] = ctx._getJsonCall();
			expect(response.success).toBe(false);
			expect(response.error.code).toBe('INTERNAL_ERROR');
			expect(response.error.message).toBe('An unexpected error occurred');
		});

		it('should log error via logger', () => {
			const error = new Error('Test error');
			const ctx = createMockContext();

			errorHandler(error, ctx as unknown as Context);

			expect(mockLogger.error).toHaveBeenCalledWith(
				'Unexpected error',
				error,
			);
		});
	});
});
