/**
 * @file Unit tests for the DeleteUserUseCase.
 *
 * Covers successful deletion, user not found, GDPR-critical anonymized
 * user treated as not found, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockUserRepository, createMockUserData } from '../../../../tests/setup.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DeleteUserUseCase } from './delete-user.use-case.js';

describe('DeleteUserUseCase', () => {
	let useCase: DeleteUserUseCase;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const user = { ...createMockUserData(), email: 'test@example.com' };

	beforeEach(() => {
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteUserUseCase);
	});

	// Happy path: user exists, is not anonymized, deletion succeeds
	it('should delete user when found', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockUserRepo.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(true);
		expect(mockUserRepo.delete).toHaveBeenCalledWith(user.id);
	});

	// User UUID does not exist
	it('should return UserNotFoundError when user does not exist', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('nonexistent');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
		expect(mockUserRepo.delete).not.toHaveBeenCalled();
	});

	// GDPR: anonymized users are treated as not found
	it('should return UserNotFoundError when user is anonymized', async () => {
		const anonymizedUser = { ...user, anonymizedAt: new Date() };
		mockUserRepo.findById.mockResolvedValue(ok(anonymizedUser));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
		expect(mockUserRepo.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup propagates
	it('should propagate error from findById', async () => {
		mockUserRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
