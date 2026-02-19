/**
 * @file Unit tests for the ListTripsUseCase.
 *
 * Covers paginated listing, default pagination parameters, and repository
 * error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTripRepository } from '../../../../tests/setup.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { ListTripsUseCase } from './list-trips.use-case.js';

describe('ListTripsUseCase', () => {
	let useCase: ListTripsUseCase;
	let mockTripRepo: ReturnType<typeof createMockTripRepository>;

	const trips = [
		{ id: 'trip-1', refId: 1, dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 },
	];

	beforeEach(() => {
		mockTripRepo = createMockTripRepository();
		container.registerInstance(TOKENS.TripRepository, mockTripRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(ListTripsUseCase);
	});

	// Happy path with explicit pagination
	it('should return paginated trips with meta', async () => {
		mockTripRepo.findAll.mockResolvedValue(ok({ data: trips, total: 1 }));

		const result = await useCase.execute({ page: 1, limit: 10 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(trips);
			expect(result.value.meta).toEqual({
				page: 1,
				limit: 10,
				total: 1,
				totalPages: 1,
			});
		}
	});

	// Default pagination when no params provided
	it('should use default pagination (page 1, limit 20) when no params', async () => {
		mockTripRepo.findAll.mockResolvedValue(ok({ data: [], total: 0 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.meta).toEqual({
				page: 1,
				limit: 20,
				total: 0,
				totalPages: 0,
			});
		}
	});

	// DB error propagates
	it('should propagate repository error', async () => {
		mockTripRepo.findAll.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ page: 1, limit: 10 });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
