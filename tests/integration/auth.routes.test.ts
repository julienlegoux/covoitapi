import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { RegisterUseCase } from '../../src/application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../src/application/use-cases/auth/login.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { UserAlreadyExistsError, InvalidCredentialsError } from '../../src/lib/errors/domain.errors.js';
import { jsonHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Auth Routes', () => {
	let registerMock: { execute: ReturnType<typeof vi.fn> };
	let loginMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		registerMock = registerMockUseCase(RegisterUseCase);
		loginMock = registerMockUseCase(LoginUseCase);
	});

	describe('POST /api/auth/register', () => {
		const validBody = {
			email: 'test@test.com',
			password: 'Password1',
			confirmPassword: 'Password1',
			firstName: 'John',
			lastName: 'Doe',
			phone: '0612345678',
		};

		it('should return 201 on successful registration', async () => {
			registerMock.execute.mockResolvedValue(ok({ id: 'u1', email: 'test@test.com' }));
			const res = await app.request('/api/auth/register', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: jsonHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: { id: 'u1', email: 'test@test.com' } });
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/auth/register', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: jsonHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should return 409 when user already exists', async () => {
			registerMock.execute.mockResolvedValue(err(new UserAlreadyExistsError('test@test.com')));
			const res = await app.request('/api/auth/register', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: jsonHeaders(),
			});
			expect(res.status).toBe(409);
			const body = await res.json();
			expect(body.error.code).toBe('USER_ALREADY_EXISTS');
		});
	});

	describe('POST /api/auth/login', () => {
		const validBody = { email: 'test@test.com', password: 'Password1' };

		it('should return 200 on successful login', async () => {
			loginMock.execute.mockResolvedValue(ok({ token: 'jwt-token' }));
			const res = await app.request('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: jsonHeaders(),
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: { token: 'jwt-token' } });
		});

		it('should return 401 for invalid credentials', async () => {
			loginMock.execute.mockResolvedValue(err(new InvalidCredentialsError()));
			const res = await app.request('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: jsonHeaders(),
			});
			expect(res.status).toBe(401);
			const body = await res.json();
			expect(body.error.code).toBe('INVALID_CREDENTIALS');
		});

		it('should reject missing fields', async () => {
			const res = await app.request('/api/auth/login', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: jsonHeaders(),
			});
			expect(res.ok).toBe(false);
		});
	});
});
