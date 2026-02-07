import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListInscriptionsUseCase } from './list-inscriptions.use-case.js';

describe('ListInscriptionsUseCase', () => {
	let useCase: ListInscriptionsUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		useCase = container.resolve(ListInscriptionsUseCase);
	});

	it('should return list of inscriptions', async () => {
		const inscriptions = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
		mockRepo.findAll.mockResolvedValue(ok(inscriptions));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(inscriptions);
	});

	it('should return empty array', async () => {
		mockRepo.findAll.mockResolvedValue(ok([]));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockRepo.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});
});
