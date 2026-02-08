import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListInscriptionsUseCase } from './list-inscriptions.use-case.js';

describe('ListInscriptionsUseCase', () => {
	let useCase: ListInscriptionsUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		useCase = container.resolve(ListInscriptionsUseCase);
	});

	it('should return paginated list of inscriptions', async () => {
		const inscriptions = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
		mockRepo.findAll.mockResolvedValue(ok({ data: inscriptions, total: 1 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(inscriptions);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array', async () => {
		mockRepo.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockRepo.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});

	it('should pass pagination params to repository', async () => {
		mockRepo.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		await useCase.execute({ page: 2, limit: 10 });
		expect(mockRepo.findAll).toHaveBeenCalledWith({ skip: 10, take: 10 });
	});
});
