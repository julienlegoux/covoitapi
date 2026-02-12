/**
 * @file Unit tests for the DeleteInscriptionUseCase.
 *
 * Covers successful deletion, not-found guard, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger } from '../../../../tests/setup.js';
import { InscriptionNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteInscriptionUseCase } from './delete-inscription.use-case.js';

// Test suite for cancelling (deleting) inscriptions
describe('DeleteInscriptionUseCase', () => {
	let useCase: DeleteInscriptionUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteInscriptionUseCase);
	});

	// Happy path: inscription exists and is deleted
	it('should delete inscription successfully', async () => {
		mockRepo.findById.mockResolvedValue(ok({ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }));
		mockRepo.delete.mockResolvedValue(ok(undefined));
		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockRepo.delete).toHaveBeenCalledWith('1');
	});

	// Not-found guard: null lookup returns InscriptionNotFoundError
	it('should return InscriptionNotFoundError when not found', async () => {
		mockRepo.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(InscriptionNotFoundError);
		expect(mockRepo.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
	});
});
