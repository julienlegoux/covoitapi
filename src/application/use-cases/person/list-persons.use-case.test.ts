import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockUserRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListUsersUseCase } from '../user/list-users.use-case.js';

describe('ListUsersUseCase', () => {
	let useCase: ListUsersUseCase;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	beforeEach(() => {
		mockUserRepository = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		useCase = container.resolve(ListUsersUseCase);
	});

	it('should return list of users', async () => {
		const users = [{ id: '1', email: 'a@b.com', password: 'h', firstName: 'A', lastName: 'B', phone: '0612345678', createdAt: new Date(), updatedAt: new Date() }];
		mockUserRepository.findAll.mockResolvedValue(ok(users));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(users);
	});

	it('should return empty array', async () => {
		mockUserRepository.findAll.mockResolvedValue(ok([]));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockUserRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});
});
