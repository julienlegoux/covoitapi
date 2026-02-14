/**
 * @file Unit tests for the DeleteInscriptionUseCase.
 *
 * Covers successful deletion, not-found/ownership guard (combined into a
 * single query), and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger } from '../../../../tests/setup.js';
import { InscriptionNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteInscriptionUseCase } from './delete-inscription.use-case.js';

// Test suite for cancelling (deleting) inscriptions with ownership check
describe('DeleteInscriptionUseCase', () => {
	let useCase: DeleteInscriptionUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	const inscription = { id: 'ins-1', refId: 1, createdAt: new Date(), userRefId: 1, routeRefId: 1 };

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteInscriptionUseCase);
	});

	// Happy path: inscription exists and belongs to user, inscription is deleted
	it('should delete inscription successfully', async () => {
		mockRepo.findByIdAndUserId.mockResolvedValue(ok(inscription));
		mockRepo.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute({ id: 'ins-1', userId: 'user-1' });
		expect(result.success).toBe(true);
		expect(mockRepo.findByIdAndUserId).toHaveBeenCalledWith('ins-1', 'user-1');
		expect(mockRepo.delete).toHaveBeenCalledWith('ins-1');
	});

	// Not found or wrong owner: returns InscriptionNotFoundError
	it('should return InscriptionNotFoundError when not found or not owned', async () => {
		mockRepo.findByIdAndUserId.mockResolvedValue(ok(null));
		const result = await useCase.execute({ id: '999', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(InscriptionNotFoundError);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockRepo.findByIdAndUserId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ id: 'ins-1', userId: 'user-1' });
		expect(result.success).toBe(false);
	});
});
