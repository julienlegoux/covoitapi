import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createMockEmailService,
	createMockJwtService,
	createMockPasswordService,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { UserAlreadyExistsError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../infrastructure/di/tokens.js';
import type { RegisterInput } from '../../dtos/auth.dto.js';
import { RegisterUseCase } from './register.use_case.js';

describe('RegisterUseCase', () => {
	let registerUseCase: RegisterUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockPasswordService: ReturnType<typeof createMockPasswordService>;
	let mockEmailService: ReturnType<typeof createMockEmailService>;
	let mockJwtService: ReturnType<typeof createMockJwtService>;

	const validInput: RegisterInput = {
		email: 'test@example.com',
		password: 'Password123!',
		confirmPassword: 'Password123!',
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
	};

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		mockPasswordService = createMockPasswordService();
		mockEmailService = createMockEmailService();
		mockJwtService = createMockJwtService();

		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.PasswordService, mockPasswordService);
		container.registerInstance(TOKENS.EmailService, mockEmailService);
		container.registerInstance(TOKENS.JwtService, mockJwtService);

		registerUseCase = container.resolve(RegisterUseCase);
	});

	it('should register a new user successfully', async () => {
		const createdUser = {
			id: 'user-123',
			email: validInput.email,
			password: 'hashed-password',
			firstName: validInput.firstName,
			lastName: validInput.lastName,
			phone: validInput.phone,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockUserRepository.existsByEmail.mockResolvedValue(false);
		mockPasswordService.hash.mockResolvedValue('hashed-password');
		mockUserRepository.create.mockResolvedValue(createdUser);
		mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
		mockJwtService.sign.mockResolvedValue('jwt-token');

		const result = await registerUseCase.execute(validInput);

		expect(result.userId).toBe('user-123');
		expect(result.token).toBe('jwt-token');
		expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.hash).toHaveBeenCalledWith(validInput.password);
		expect(mockUserRepository.create).toHaveBeenCalledWith({
			email: validInput.email,
			password: 'hashed-password',
			firstName: validInput.firstName,
			lastName: validInput.lastName,
			phone: validInput.phone,
		});
		expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
			validInput.email,
			validInput.firstName,
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123' });
	});

	it('should throw UserAlreadyExistsError when email is taken', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(true);

		await expect(registerUseCase.execute(validInput)).rejects.toThrow(UserAlreadyExistsError);
		expect(mockUserRepository.create).not.toHaveBeenCalled();
		expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
	});
});
