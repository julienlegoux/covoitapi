/**
 * @file Unit tests for the RegisterUseCase.
 *
 * Covers the full registration flow including Auth + User creation in a
 * single transaction, password hashing, welcome email dispatch, JWT
 * issuance, and the duplicate-email error path. All dependencies are mocked.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockAuthRepository,
	createMockEmailService,
	createMockJwtService,
	createMockLogger,
	createMockPasswordService,
} from '../../../../tests/setup.js';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok } from '../../../lib/shared/types/result.js';
import type { RegisterSchemaType } from '../../schemas/auth.schema.js';
import { RegisterUseCase } from './register.use-case.js';

// Main test suite for the user registration use case
describe('RegisterUseCase', () => {
	let registerUseCase: RegisterUseCase;
	let mockAuthRepository: ReturnType<typeof createMockAuthRepository>;
	let mockPasswordService: ReturnType<typeof createMockPasswordService>;
	let mockEmailService: ReturnType<typeof createMockEmailService>;
	let mockJwtService: ReturnType<typeof createMockJwtService>;

	const validInput: RegisterSchemaType = {
		email: 'test@example.com',
		password: 'Password123!',
		confirmPassword: 'Password123!',
	};

	beforeEach(() => {
		mockAuthRepository = createMockAuthRepository();
		mockPasswordService = createMockPasswordService();
		mockEmailService = createMockEmailService();
		mockJwtService = createMockJwtService();

		container.registerInstance(TOKENS.AuthRepository, mockAuthRepository);
		container.registerInstance(TOKENS.PasswordService, mockPasswordService);
		container.registerInstance(TOKENS.EmailService, mockEmailService);
		container.registerInstance(TOKENS.JwtService, mockJwtService);
		container.registerInstance(TOKENS.Logger, createMockLogger());

		registerUseCase = container.resolve(RegisterUseCase);
	});

	// Verifies the happy path: new email leads to Auth+User creation, email sent, JWT issued
	it('should register a new user successfully', async () => {
		const createdAuth = {
			id: 'auth-123',
			refId: 1,
			email: validInput.email,
			password: 'hashed-password',
			role: 'USER',
			anonymizedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const createdUser = {
			id: 'user-123',
			refId: 1,
			authRefId: 1,
			firstName: null,
			lastName: null,
			phone: null,
			email: validInput.email,
			anonymizedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockAuthRepository.existsByEmail.mockResolvedValue(ok(false));
		mockPasswordService.hash.mockResolvedValue(ok('hashed-password'));
		mockAuthRepository.createWithUser.mockResolvedValue(ok({ auth: createdAuth, user: createdUser }));
		mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));
		mockJwtService.sign.mockResolvedValue(ok('jwt-token'));

		const result = await registerUseCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.userId).toBe('user-123');
			expect(result.value.token).toBe('jwt-token');
		}
		expect(mockAuthRepository.existsByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.hash).toHaveBeenCalledWith(validInput.password);
		expect(mockAuthRepository.createWithUser).toHaveBeenCalledWith(
			{ email: validInput.email, password: 'hashed-password' },
			{ firstName: null, lastName: null, phone: null },
		);
		expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
			validInput.email,
			'there',
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123', role: 'USER' });
	});

	// Verifies that a duplicate email is rejected and no records are created
	it('should return UserAlreadyExistsError when email is taken', async () => {
		mockAuthRepository.existsByEmail.mockResolvedValue(ok(true));

		const result = await registerUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(UserAlreadyExistsError);
		}
		expect(mockAuthRepository.createWithUser).not.toHaveBeenCalled();
		expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
	});
});
