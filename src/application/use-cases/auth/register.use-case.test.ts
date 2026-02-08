import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockEmailService,
	createMockJwtService,
	createMockPasswordService,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok } from '../../../lib/shared/types/result.js';
import type { RegisterInput } from '../../dtos/auth.dto.js';
import { RegisterUseCase } from './register.use-case.js';

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
			role: 'USER',
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		mockUserRepository.existsByEmail.mockResolvedValue(ok(false));
		mockPasswordService.hash.mockResolvedValue(ok('hashed-password'));
		mockUserRepository.create.mockResolvedValue(ok(createdUser));
		mockEmailService.sendWelcomeEmail.mockResolvedValue(ok(undefined));
		mockJwtService.sign.mockResolvedValue(ok('jwt-token'));

		const result = await registerUseCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.userId).toBe('user-123');
			expect(result.value.token).toBe('jwt-token');
		}
		expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(validInput.email);
		expect(mockPasswordService.hash).toHaveBeenCalledWith(validInput.password);
		expect(mockUserRepository.create).toHaveBeenCalledWith({
			email: validInput.email,
			password: 'hashed-password',
			role: 'USER',
		});
		expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
			validInput.email,
			'there',
		);
		expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: 'user-123', role: 'USER' });
	});

	it('should return UserAlreadyExistsError when email is taken', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(ok(true));

		const result = await registerUseCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(UserAlreadyExistsError);
		}
		expect(mockUserRepository.create).not.toHaveBeenCalled();
		expect(mockEmailService.sendWelcomeEmail).not.toHaveBeenCalled();
	});
});
