/**
 * @file Unit tests for the DeleteInscriptionUseCase.
 *
 * Covers successful deletion, not-found guard, ownership verification,
 * and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockUserRepository, createMockLogger } from '../../../../tests/setup.js';
import { InscriptionNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteInscriptionUseCase } from './delete-inscription.use-case.js';

// Test suite for cancelling (deleting) inscriptions with ownership check
describe('DeleteInscriptionUseCase', () => {
	let useCase: DeleteInscriptionUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	const user = { id: 'user-1', refId: 1, firstName: 'John', lastName: 'Doe', phone: '0600000000' };
	const inscription = { id: 'ins-1', refId: 1, createdAt: new Date(), userRefId: 1, routeRefId: 1 };

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		mockUserRepository = createMockUserRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteInscriptionUseCase);
	});

	function mockUserResolution() {
		mockUserRepository.findById.mockResolvedValue(ok(user));
	}

	// Happy path: inscription exists, owner matches, inscription is deleted
	it('should delete inscription successfully', async () => {
		mockRepo.findById.mockResolvedValue(ok(inscription));
		mockUserResolution();
		mockRepo.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute({ id: 'ins-1', userId: 'user-1' });
		expect(result.success).toBe(true);
		expect(mockRepo.delete).toHaveBeenCalledWith('ins-1');
	});

	// Not-found guard: null lookup returns InscriptionNotFoundError
	it('should return InscriptionNotFoundError when not found', async () => {
		mockRepo.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute({ id: '999', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(InscriptionNotFoundError);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	// Ownership check: different user returns ForbiddenError
	it('should return ForbiddenError when user does not own the inscription', async () => {
		const otherUserInscription = { ...inscription, userRefId: 99 };
		mockRepo.findById.mockResolvedValue(ok(otherUserInscription));
		mockUserResolution();

		const result = await useCase.execute({ id: 'ins-1', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ForbiddenError);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ id: 'ins-1', userId: 'user-1' });
		expect(result.success).toBe(false);
	});
});
