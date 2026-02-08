import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { register, login } from './auth.controller.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { InvalidCredentialsError, UserAlreadyExistsError } from '../../domain/errors/domain.errors.js';

function createMockContext(jsonBody: unknown) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	return {
		req: {
			json: vi.fn().mockResolvedValue(jsonBody),
		},
		json: jsonMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Auth Controller', () => {
	const validRegisterInput = {
		email: 'test@example.com',
		password: 'Password123',
		confirmPassword: 'Password123',
	};

	const validLoginInput = {
		email: 'test@example.com',
		password: 'Password123',
	};

	describe('register()', () => {
		let mockRegisterUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockRegisterUseCase = { execute: vi.fn() };
			container.register(RegisterUseCase, { useValue: mockRegisterUseCase as unknown as RegisterUseCase });
		});

		it('should return 201 with userId and token on success', async () => {
			mockRegisterUseCase.execute.mockResolvedValue(
				ok({ userId: 'user-123', token: 'jwt-token' }),
			);

			const ctx = createMockContext(validRegisterInput);
			await register(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({
				success: true,
				data: { userId: 'user-123', token: 'jwt-token' },
			});
		});

		it('should call RegisterUseCase with correct input', async () => {
			mockRegisterUseCase.execute.mockResolvedValue(
				ok({ userId: 'user-123', token: 'jwt-token' }),
			);

			const ctx = createMockContext(validRegisterInput);
			await register(ctx);

			expect(mockRegisterUseCase.execute).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'Password123',
				confirmPassword: 'Password123',
			});
		});

		it('should return error response when use case fails', async () => {
			const error = new UserAlreadyExistsError('test@example.com');
			mockRegisterUseCase.execute.mockResolvedValue(err(error));

			const ctx = createMockContext(validRegisterInput);
			await register(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(409);
			expect(response).toEqual({
				success: false,
				error: {
					code: 'USER_ALREADY_EXISTS',
					message: 'A user with email "test@example.com" already exists',
				},
			});
		});

		it('should throw ZodError for invalid input (caught by error handler)', async () => {
			const ctx = createMockContext({ email: 'invalid' });

			await expect(register(ctx)).rejects.toThrow();
		});
	});

	describe('login()', () => {
		let mockLoginUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockLoginUseCase = { execute: vi.fn() };
			container.register(LoginUseCase, { useValue: mockLoginUseCase as unknown as LoginUseCase });
		});

		it('should return 200 with userId and token on success', async () => {
			mockLoginUseCase.execute.mockResolvedValue(
				ok({ userId: 'user-123', token: 'jwt-token' }),
			);

			const ctx = createMockContext(validLoginInput);
			await login(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({
				success: true,
				data: { userId: 'user-123', token: 'jwt-token' },
			});
		});

		it('should call LoginUseCase with correct input', async () => {
			mockLoginUseCase.execute.mockResolvedValue(
				ok({ userId: 'user-123', token: 'jwt-token' }),
			);

			const ctx = createMockContext(validLoginInput);
			await login(ctx);

			expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
				email: 'test@example.com',
				password: 'Password123',
			});
		});

		it('should return error response when use case fails', async () => {
			const error = new InvalidCredentialsError();
			mockLoginUseCase.execute.mockResolvedValue(err(error));

			const ctx = createMockContext(validLoginInput);
			await login(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(401);
			expect(response).toEqual({
				success: false,
				error: {
					code: 'INVALID_CREDENTIALS',
					message: 'Invalid email or password',
				},
			});
		});

		it('should throw ZodError for invalid input (caught by error handler)', async () => {
			const ctx = createMockContext({ email: 'invalid' });

			await expect(login(ctx)).rejects.toThrow();
		});
	});
});
