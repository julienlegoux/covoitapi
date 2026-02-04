import { container } from 'tsyringe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createMockJwtService,
	createMockPasswordService,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { LoginInput } from '../../dtos/auth.dto.js';
import { LoginUseCase } from './login.use-case.js';

describe('LoginUseCase', () => {
	let loginUseCase: LoginUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockPasswordService: ReturnType<typeof createMockPasswordService>;
	let mockJwtService: ReturnType<typeof createMockJwtService>;

	const validInput: LoginInput = {
		email: 'test@example.com',
		password: 'Password123!',
	};

	const existingUser = {
		id: 'user-123',
		email: 'test@example.com',
		password: 'hashed-password',
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		mockPasswordService = createMockPasswordService();
		mockJwtService = createMockJwtService();

		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.PasswordService, mockPasswordService);
		container.registerInstance(TOKENS.JwtService, mockJwtService);

		loginUseCase = container.resolve(LoginUseCase);
	});

	it('should login successfully with valid credentials', async () => {
		mockUserRepository.findByEmail.mockResolvedValue(existingUser);
		mockPasswordService.verify.mockResolvedValue(true);
		mockJwtService.sign.mockResolvedValue('jwt-token');

		const result = await loginUseCase.execute(validInput);

		expect(result.userId).toBe('user-123');
		expect(result.token).toBe('jwt-token');
		expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.verify).toHaveBeenCalledWith(
			validInput.password,
			existingUser.password,
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123' });
	});

	it('should throw InvalidCredentialsError when user not found', async () => {
		mockUserRepository.findByEmail.mockResolvedValue(null);

		await expect(loginUseCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError);
		expect(mockPasswordService.verify).not.toHaveBeenCalled();
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});

	it('should throw InvalidCredentialsError when password is wrong', async () => {
		mockUserRepository.findByEmail.mockResolvedValue(existingUser);
		mockPasswordService.verify.mockResolvedValue(false);

		await expect(loginUseCase.execute(validInput)).rejects.toThrow(InvalidCredentialsError);
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});
});
