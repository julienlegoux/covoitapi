/**
 * @file Unit tests for the UpdateUserUseCase.
 *
 * Covers full and partial profile updates, user not found, GDPR-critical
 * anonymized user treated as not found, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockUserRepository, createMockUserData } from '../../../../tests/setup.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { UpdateUserUseCase } from './update-user.use-case.js';

describe('UpdateUserUseCase', () => {
	let useCase: UpdateUserUseCase;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const user = { ...createMockUserData(), email: 'test@example.com' };

	beforeEach(() => {
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(UpdateUserUseCase);
	});

	// Happy path: all fields provided
	it('should update user with all fields', async () => {
		const updatedUser = { ...user, firstName: 'Jane', lastName: 'Smith', phone: '0699999999' };
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockUserRepo.update.mockResolvedValue(ok(updatedUser));

		const result = await useCase.execute(user.id, {
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '0699999999',
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(updatedUser);
		expect(mockUserRepo.update).toHaveBeenCalledWith(user.id, {
			firstName: 'Jane',
			lastName: 'Smith',
			phone: '0699999999',
		});
	});

	// Partial update: only firstName provided — other fields not sent to repo
	it('should only pass provided fields to repository', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockUserRepo.update.mockResolvedValue(ok({ ...user, firstName: 'Jane' }));

		await useCase.execute(user.id, { firstName: 'Jane' });

		expect(mockUserRepo.update).toHaveBeenCalledWith(user.id, { firstName: 'Jane' });
	});

	// User UUID does not exist
	it('should return UserNotFoundError when user does not exist', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('nonexistent', { firstName: 'Jane' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
		expect(mockUserRepo.update).not.toHaveBeenCalled();
	});

	// GDPR: anonymized users are treated as not found
	it('should return UserNotFoundError when user is anonymized', async () => {
		const anonymizedUser = { ...user, anonymizedAt: new Date() };
		mockUserRepo.findById.mockResolvedValue(ok(anonymizedUser));

		const result = await useCase.execute(user.id, { firstName: 'Jane' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
		expect(mockUserRepo.update).not.toHaveBeenCalled();
	});

	// DB error during update propagates
	it('should propagate error from userRepository.update', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockUserRepo.update.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(user.id, { firstName: 'Jane' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
