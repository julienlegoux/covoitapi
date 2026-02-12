/**
 * @file Unit tests for the ListRoutePassengersUseCase.
 *
 * Covers passenger listing for a specific travel with default and custom
 * pagination, empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger, createMockTravelRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListRoutePassengersUseCase } from './list-route-passengers.use-case.js';

// Test suite for listing passengers on a specific travel route
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
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(ListRoutePassengersUseCase);
	});

	// Happy path: returns passengers with UUID-to-refId resolution
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

	// Edge case: no passengers inscribed on this travel
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

	// DB error during inscription fetch bubbles up
	it('should propagate repository error', async () => {
		mockTravelRepo.findById.mockResolvedValue(ok(travel));
		mockRepo.findByRouteRefId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});

	// In-memory pagination: slices the full list with custom page/limit
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
