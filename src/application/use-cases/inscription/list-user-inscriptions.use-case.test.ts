import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListUserInscriptionsUseCase } from './list-user-inscriptions.use-case.js';

describe('ListUserInscriptionsUseCase', () => {
	let useCase: ListUserInscriptionsUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		useCase = container.resolve(ListUserInscriptionsUseCase);
	});

	it('should return inscriptions for user', async () => {
		const inscriptions = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
		mockRepo.findByUserId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1');

		expect(result.success).toBe(true);
		expect(mockRepo.findByUserId).toHaveBeenCalledWith('u1');
	});

	it('should return empty array when user has none', async () => {
		mockRepo.findByUserId.mockResolvedValue(ok([]));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockRepo.findByUserId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(false);
	});
});
