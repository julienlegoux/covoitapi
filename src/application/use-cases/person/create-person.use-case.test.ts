import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockUserRepository, createMockPasswordService } from '../../../../tests/setup.js';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateUserUseCase } from '../user/create-user.use-case.js';

describe('CreateUserUseCase', () => {
	let useCase: CreateUserUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockPasswordService: ReturnType<typeof createMockPasswordService>;

	const validInput = { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '0612345678', password: 'Password1' };

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		mockPasswordService = createMockPasswordService();
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.PasswordService, mockPasswordService);
		useCase = container.resolve(CreateUserUseCase);
	});

	it('should create user successfully', async () => {
		const createdUser = { id: 'u1', ...validInput, password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
		mockUserRepository.existsByEmail.mockResolvedValue(ok(false));
		mockPasswordService.hash.mockResolvedValue(ok('hashed'));
		mockUserRepository.create.mockResolvedValue(ok(createdUser));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockPasswordService.hash).toHaveBeenCalledWith('Password1');
		expect(mockUserRepository.create).toHaveBeenCalledWith({
			email: 'john@example.com',
			password: 'hashed',
			firstName: 'John',
			lastName: 'Doe',
			phone: '0612345678',
		});
	});

	it('should return UserAlreadyExistsError when email taken', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(ok(true));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserAlreadyExistsError);
		expect(mockPasswordService.hash).not.toHaveBeenCalled();
	});

	it('should propagate error from existsByEmail', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from password hash', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(ok(false));
		mockPasswordService.hash.mockResolvedValue(err(new DatabaseError('hash error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from user create', async () => {
		mockUserRepository.existsByEmail.mockResolvedValue(ok(false));
		mockPasswordService.hash.mockResolvedValue(ok('hashed'));
		mockUserRepository.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});
});
