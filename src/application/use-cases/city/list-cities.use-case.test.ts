/**
 * @file Unit tests for the ListCitiesUseCase.
 *
 * Covers paginated city listing with default and custom pagination,
 * empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCityRepository, createMockLogger } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListCitiesUseCase } from './list-cities.use-case.js';

// Test suite for listing cities with pagination
describe('ListCitiesUseCase', () => {
	let useCase: ListCitiesUseCase;
	let mockCityRepository: ReturnType<typeof createMockCityRepository>;

	beforeEach(() => {
		mockCityRepository = createMockCityRepository();
		container.registerInstance(TOKENS.CityRepository, mockCityRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(ListCitiesUseCase);
	});

	// Happy path: returns cities with default pagination meta
	it('should return paginated list of cities', async () => {
		const cities = [{ id: '1', cityName: 'Paris', zipcode: '75000' }];
		mockCityRepository.findAll.mockResolvedValue(ok({ data: cities, total: 1 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(cities);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	// Edge case: empty dataset
	it('should return empty array', async () => {
		mockCityRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	// DB error bubbles up unchanged
	it('should propagate repository error', async () => {
		mockCityRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});

	// Verifies page/limit conversion to skip/take
	it('should pass pagination params to repository', async () => {
		mockCityRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		await useCase.execute({ page: 3, limit: 5 });
		expect(mockCityRepository.findAll).toHaveBeenCalledWith({ skip: 10, take: 5 });
	});
});
