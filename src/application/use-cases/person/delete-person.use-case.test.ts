import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockUserRepository } from '../../../../tests/setup.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteUserUseCase } from '../user/delete-user.use-case.js';

describe('DeleteUserUseCase', () => {
	let useCase: DeleteUserUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		useCase = container.resolve(DeleteUserUseCase);
	});

	it('should delete user successfully', async () => {
		mockUserRepository.findById.mockResolvedValue(ok({ id: '1', email: 'a@b.com', password: 'h', firstName: 'A', lastName: 'B', phone: '06', createdAt: new Date(), updatedAt: new Date() }));
		mockUserRepository.delete.mockResolvedValue(ok(undefined));
		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
	});

	it('should return UserNotFoundError when not found', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
		expect(mockUserRepository.delete).not.toHaveBeenCalled();
	});

	it('should propagate repository error', async () => {
		mockUserRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
	});
});
