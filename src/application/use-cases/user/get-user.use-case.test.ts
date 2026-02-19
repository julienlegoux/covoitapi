/**
 * @file Unit tests for the GetUserUseCase.
 *
 * Covers successful retrieval, user not found, GDPR-critical anonymized
 * user treated as not found, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockUserRepository, createMockUserData } from '../../../../tests/setup.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { GetUserUseCase } from './get-user.use-case.js';

describe('GetUserUseCase', () => {
	let useCase: GetUserUseCase;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const user = { ...createMockUserData(), email: 'test@example.com' };

	beforeEach(() => {
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(GetUserUseCase);
	});

	// Happy path: user exists and is not anonymized
	it('should return user when found', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(user);
	});

	// User UUID does not exist
	it('should return UserNotFoundError when user does not exist', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('nonexistent');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
	});

	// GDPR: anonymized users are treated as not found
	it('should return UserNotFoundError when user is anonymized', async () => {
		const anonymizedUser = { ...user, anonymizedAt: new Date() };
		mockUserRepo.findById.mockResolvedValue(ok(anonymizedUser));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(UserNotFoundError);
	});

	// DB error propagates
	it('should propagate repository error', async () => {
		mockUserRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(user.id);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
