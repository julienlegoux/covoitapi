import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListRoutePassengersUseCase } from './list-route-passengers.use-case.js';

describe('ListRoutePassengersUseCase', () => {
	let useCase: ListRoutePassengersUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		useCase = container.resolve(ListRoutePassengersUseCase);
	});

	it('should return passengers for route', async () => {
		const passengers = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
		mockRepo.findByRouteId.mockResolvedValue(ok(passengers));

		const result = await useCase.execute('r1');

		expect(result.success).toBe(true);
		expect(mockRepo.findByRouteId).toHaveBeenCalledWith('r1');
	});

	it('should return empty array when no passengers', async () => {
		mockRepo.findByRouteId.mockResolvedValue(ok([]));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockRepo.findByRouteId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});
});
