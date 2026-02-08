import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockUserRepository } from '../../../../tests/setup.js';
import { UserNotFoundError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { UpdateUserUseCase } from '../user/update-user.use-case.js';

describe('UpdateUserUseCase', () => {
	let useCase: UpdateUserUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	const existingUser = { id: 'u1', email: 'a@b.com', password: 'h', firstName: 'A', lastName: 'B', phone: '06', createdAt: new Date(), updatedAt: new Date() };

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		useCase = container.resolve(UpdateUserUseCase);
	});

	it('should update user with full input', async () => {
		const input = { firstName: 'John', lastName: 'Doe', email: 'john@new.com', phone: '0712345678' };
		const updated = { ...existingUser, ...input, updatedAt: new Date() };
		mockUserRepository.findById.mockResolvedValue(ok(existingUser));
		mockUserRepository.update.mockResolvedValue(ok(updated));

		const result = await useCase.execute('u1', input);

		expect(result.success).toBe(true);
		expect(mockUserRepository.update).toHaveBeenCalledWith('u1', {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john@new.com',
			phone: '0712345678',
		});
	});

	it('should update user with partial input (patch)', async () => {
		const input = { email: 'new@example.com', phone: '0712345678' };
		mockUserRepository.findById.mockResolvedValue(ok(existingUser));
		mockUserRepository.update.mockResolvedValue(ok({ ...existingUser, ...input }));

		const result = await useCase.execute('u1', input);

		expect(result.success).toBe(true);
		expect(mockUserRepository.update).toHaveBeenCalledWith('u1', {
			email: 'new@example.com',
			phone: '0712345678',
		});
	});

	it('should return UserNotFoundError when user not found', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999', { email: 'a@b.com' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
	});

	it('should propagate error from findById', async () => {
		mockUserRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1', { email: 'a@b.com' });
		expect(result.success).toBe(false);
	});

	it('should propagate error from update', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(existingUser));
		mockUserRepository.update.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1', { email: 'new@example.com' });
		expect(result.success).toBe(false);
	});
});
