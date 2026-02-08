import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockTravelRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListRoutePassengersUseCase } from './list-route-passengers.use-case.js';

describe('ListRoutePassengersUseCase', () => {
	let useCase: ListRoutePassengersUseCase;
	let mockRepo: ReturnType<typeof createMockInscriptionRepository>;
	let mockTravelRepo: ReturnType<typeof createMockTravelRepository>;

	const travel = { id: 'r1', refId: 10, dateRoute: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 };

	beforeEach(() => {
		mockRepo = createMockInscriptionRepository();
		mockTravelRepo = createMockTravelRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockRepo);
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepo);
		useCase = container.resolve(ListRoutePassengersUseCase);
	});

	it('should return paginated passengers for route', async () => {
		const passengers = [{ id: '1', refId: 1, createdAt: new Date(), userRefId: 1, routeRefId: 10, status: 'ACTIVE' }];
		mockTravelRepo.findById.mockResolvedValue(ok(travel));
		mockRepo.findByRouteRefId.mockResolvedValue(ok(passengers));

		const result = await useCase.execute('r1');

		expect(result.success).toBe(true);
		expect(mockTravelRepo.findById).toHaveBeenCalledWith('r1');
		expect(mockRepo.findByRouteRefId).toHaveBeenCalledWith(10);
		if (result.success) {
			expect(result.value.data).toEqual(passengers);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array when no passengers', async () => {
		mockTravelRepo.findById.mockResolvedValue(ok(travel));
		mockRepo.findByRouteRefId.mockResolvedValue(ok([]));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockTravelRepo.findById.mockResolvedValue(ok(travel));
		mockRepo.findByRouteRefId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});

	it('should paginate results with custom pagination', async () => {
		const passengers = [
			{ id: '1', refId: 1, createdAt: new Date(), userRefId: 1, routeRefId: 10, status: 'ACTIVE' },
			{ id: '2', refId: 2, createdAt: new Date(), userRefId: 2, routeRefId: 10, status: 'ACTIVE' },
			{ id: '3', refId: 3, createdAt: new Date(), userRefId: 3, routeRefId: 10, status: 'ACTIVE' },
		];
		mockTravelRepo.findById.mockResolvedValue(ok(travel));
		mockRepo.findByRouteRefId.mockResolvedValue(ok(passengers));

		const result = await useCase.execute('r1', { page: 1, limit: 2 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([passengers[0], passengers[1]]);
			expect(result.value.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
		}
	});
});
