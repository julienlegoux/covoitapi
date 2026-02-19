/**
 * @file Unit tests for the FindTripUseCase.
 *
 * Covers filter passthrough, date string-to-Date conversion, empty filters,
 * and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTripRepository } from '../../../../tests/setup.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { FindTripUseCase } from './find-trip.use-case.js';

describe('FindTripUseCase', () => {
	let useCase: FindTripUseCase;
	let mockTripRepo: ReturnType<typeof createMockTripRepository>;

	const trips = [
		{ id: 'trip-1', refId: 1, dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 },
	];

	beforeEach(() => {
		mockTripRepo = createMockTripRepository();
		container.registerInstance(TOKENS.TripRepository, mockTripRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(FindTripUseCase);
	});

	// All filters provided — date string converted to Date object
	it('should pass all filters to repository with date as Date object', async () => {
		mockTripRepo.findByFilters.mockResolvedValue(ok(trips));

		const result = await useCase.execute({
			departureCity: 'Paris',
			arrivalCity: 'Lyon',
			date: '2025-06-15',
		});

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(trips);
		expect(mockTripRepo.findByFilters).toHaveBeenCalledWith({
			departureCity: 'Paris',
			arrivalCity: 'Lyon',
			date: new Date('2025-06-15'),
		});
	});

	// No filters provided — all undefined
	it('should pass undefined filters when none provided', async () => {
		mockTripRepo.findByFilters.mockResolvedValue(ok([]));

		const result = await useCase.execute({});

		expect(result.success).toBe(true);
		expect(mockTripRepo.findByFilters).toHaveBeenCalledWith({
			departureCity: undefined,
			arrivalCity: undefined,
			date: undefined,
		});
	});

	// Date string conversion: undefined date stays undefined
	it('should not convert date when it is undefined', async () => {
		mockTripRepo.findByFilters.mockResolvedValue(ok([]));

		await useCase.execute({ departureCity: 'Paris' });

		expect(mockTripRepo.findByFilters).toHaveBeenCalledWith(
			expect.objectContaining({ date: undefined }),
		);
	});

	// DB error propagates
	it('should propagate repository error', async () => {
		mockTripRepo.findByFilters.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ departureCity: 'Paris' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
