import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockJwtService,
	createMockPasswordService,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { InvalidCredentialsError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok } from '../../../lib/shared/types/result.js';
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
		mockUserRepository.findByEmail.mockResolvedValue(ok(existingUser));
		mockPasswordService.verify.mockResolvedValue(ok(true));
		mockJwtService.sign.mockResolvedValue(ok('jwt-token'));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.userId).toBe('user-123');
			expect(result.value.token).toBe('jwt-token');
		}
		expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.verify).toHaveBeenCalledWith(
			validInput.password,
			existingUser.password,
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123' });
	});

	it('should return InvalidCredentialsError when user not found', async () => {
		mockUserRepository.findByEmail.mockResolvedValue(ok(null));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(InvalidCredentialsError);
		}
		expect(mockPasswordService.verify).not.toHaveBeenCalled();
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});

	it('should return InvalidCredentialsError when password is wrong', async () => {
		mockUserRepository.findByEmail.mockResolvedValue(ok(existingUser));
		mockPasswordService.verify.mockResolvedValue(ok(false));

		const result = await loginUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(InvalidCredentialsError);
		}
		expect(mockJwtService.sign).not.toHaveBeenCalled();
	});
});
