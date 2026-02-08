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

	it('should return paginated inscriptions for user', async () => {
		const inscriptions = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
		mockRepo.findByUserId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1');

		expect(result.success).toBe(true);
		expect(mockRepo.findByUserId).toHaveBeenCalledWith('u1');
		if (result.success) {
			expect(result.value.data).toEqual(inscriptions);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array when user has none', async () => {
		mockRepo.findByUserId.mockResolvedValue(ok([]));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockRepo.findByUserId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('u1');
		expect(result.success).toBe(false);
	});

	it('should paginate results with custom pagination', async () => {
		const inscriptions = [
			{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' },
			{ id: '2', createdAt: new Date(), userId: 'u1', routeId: 'r2' },
			{ id: '3', createdAt: new Date(), userId: 'u1', routeId: 'r3' },
		];
		mockRepo.findByUserId.mockResolvedValue(ok(inscriptions));

		const result = await useCase.execute('u1', { page: 2, limit: 1 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([inscriptions[1]]);
			expect(result.value.meta).toEqual({ page: 2, limit: 1, total: 3, totalPages: 3 });
		}
	});
});
