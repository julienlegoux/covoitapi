/**
 * @file Unit tests for the ListCarsUseCase.
 *
 * Covers paginated car listing with default and custom pagination,
 * empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListCarsUseCase } from './list-cars.use-case.js';

// Test suite for listing cars with pagination
describe('ListCarsUseCase', () => {
	let useCase: ListCarsUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		useCase = container.resolve(ListCarsUseCase);
	});

	// Happy path: returns cars with default pagination meta
	it('should return paginated list of cars', async () => {
		const cars = [{ id: '1', licensePlate: 'AB-123-CD', modelId: 'm1' }];
		mockCarRepository.findAll.mockResolvedValue(ok({ data: cars, total: 1 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(cars);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	// Edge case: empty dataset
	it('should return empty array', async () => {
		mockCarRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	// DB error bubbles up unchanged
	it('should propagate repository error', async () => {
		mockCarRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});

	// Verifies page/limit are converted to skip/take
	it('should pass pagination params to repository', async () => {
		mockCarRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		await useCase.execute({ page: 2, limit: 10 });
		expect(mockCarRepository.findAll).toHaveBeenCalledWith({ skip: 10, take: 10 });
	});
});
