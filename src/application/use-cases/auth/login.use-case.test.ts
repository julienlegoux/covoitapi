/**
 * @file Unit tests for the LoginUseCase.
 *
 * Covers the login authentication flow including successful credential
 * verification, JWT token generation, and error paths for unknown emails
 * and incorrect passwords. All repository and service dependencies are mocked.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockAuthRepository,
	createMockJwtService,
	createMockPasswordService,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { InvalidCredentialsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok } from '../../../lib/shared/types/result.js';
import type { LoginSchemaType } from '../../schemas/auth.schema.js';
import { LoginUseCase } from './login.use-case.js';

// Main test suite for the login authentication use case
describe('LoginUseCase', () => {
	let loginUseCase: LoginUseCase;
	let mockAuthRepository: ReturnType<typeof createMockAuthRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockPasswordService: ReturnType<typeof createMockPasswordService>;
	let mockJwtService: ReturnType<typeof createMockJwtService>;

	const validInput: LoginSchemaType = {
		email: 'test@example.com',
		password: 'Password123!',
	};

	const existingAuth = {
		id: 'auth-123',
		refId: 1,
		email: 'test@example.com',
		password: 'hashed-password',
		role: 'USER',
		anonymizedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const existingUser = {
		id: 'user-123',
		refId: 1,
		authRefId: 1,
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
		email: 'test@example.com',
		anonymizedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockAuthRepository = createMockAuthRepository();
		mockUserRepository = createMockUserRepository();
		mockPasswordService = createMockPasswordService();
		mockJwtService = createMockJwtService();

		container.registerInstance(TOKENS.AuthRepository, mockAuthRepository);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.PasswordService, mockPasswordService);
		container.registerInstance(TOKENS.JwtService, mockJwtService);

		loginUseCase = container.resolve(LoginUseCase);
	});

	// Verifies the happy path: valid email + password yields a JWT token
	it('should login successfully with valid credentials', async () => {
		mockAuthRepository.findByEmail.mockResolvedValue(ok(existingAuth));
		mockPasswordService.verify.mockResolvedValue(ok(true));
		mockUserRepository.findByAuthRefId.mockResolvedValue(ok(existingUser));
		mockJwtService.sign.mockResolvedValue(ok('jwt-token'));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.userId).toBe('user-123');
			expect(result.value.token).toBe('jwt-token');
		}
		expect(mockAuthRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.verify).toHaveBeenCalledWith(
			validInput.password,
			existingAuth.password,
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123', role: 'USER' });
	});

	// Verifies that an unknown email returns InvalidCredentialsError without leaking info
	it('should return InvalidCredentialsError when user not found', async () => {
		mockAuthRepository.findByEmail.mockResolvedValue(ok(null));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(InvalidCredentialsError);
		}
		expect(mockPasswordService.verify).not.toHaveBeenCalled();
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});

	// Verifies that a wrong password returns InvalidCredentialsError and skips JWT signing
	it('should return InvalidCredentialsError when password is wrong', async () => {
		mockAuthRepository.findByEmail.mockResolvedValue(ok(existingAuth));
		mockPasswordService.verify.mockResolvedValue(ok(false));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(InvalidCredentialsError);
		}
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});
});
