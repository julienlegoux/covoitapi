/**
 * @file Unit tests for the ListUsersUseCase.
 *
 * Covers successful listing and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockUserRepository, createMockUserData } from '../../../../tests/setup.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { ListUsersUseCase } from './list-users.use-case.js';

describe('ListUsersUseCase', () => {
	let useCase: ListUsersUseCase;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const users = [
		{ ...createMockUserData(), email: 'user1@example.com' },
		{ ...createMockUserData({ id: 'user-2', refId: 2 }), email: 'user2@example.com' },
	];

	beforeEach(() => {
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(ListUsersUseCase);
	});

	// Happy path: returns all users
	it('should return all users', async () => {
		mockUserRepo.findAll.mockResolvedValue(ok(users));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(users);
	});

	// DB error propagates
	it('should propagate repository error', async () => {
		mockUserRepo.findAll.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute();

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
