/**
 * @file Unit tests for the FindTravelUseCase.
 *
 * Covers search with full filters, partial filters, empty results,
 * and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTravelRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { FindTravelUseCase } from './find-travel.use-case.js';

// Test suite for searching travels by departure/arrival city and date
describe('FindTravelUseCase', () => {
	let useCase: FindTravelUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(FindTravelUseCase);
	});

	// All filters provided: departure, arrival, and date
	it('should find travels with all filters', async () => {
		const travels = [{ id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' }];
		mockTravelRepository.findByFilters.mockResolvedValue(ok(travels));

		const result = await useCase.execute({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });

		expect(result.success).toBe(true);
		expect(mockTravelRepository.findByFilters).toHaveBeenCalledWith({
			departureCity: 'Paris',
			arrivalCity: 'Lyon',
			date: new Date('2025-06-15'),
		});
	});

	// Partial filters: only departure city, others are undefined
	it('should find travels with partial filters', async () => {
		mockTravelRepository.findByFilters.mockResolvedValue(ok([]));

		await useCase.execute({ departureCity: 'Paris' });

		expect(mockTravelRepository.findByFilters).toHaveBeenCalledWith({
			departureCity: 'Paris',
			arrivalCity: undefined,
			date: undefined,
		});
	});

	// No matching travels: returns empty array
	it('should return empty array when no travels match', async () => {
		mockTravelRepository.findByFilters.mockResolvedValue(ok([]));
		const result = await useCase.execute({ departureCity: 'Nowhere' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	// DB error bubbles up unchanged
	it('should propagate repository error', async () => {
		mockTravelRepository.findByFilters.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ departureCity: 'Paris' });
		expect(result.success).toBe(false);
	});
});
