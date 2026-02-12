/**
 * @file Unit tests for the ListBrandsUseCase.
 *
 * Covers paginated brand listing with default and custom pagination,
 * empty results, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockBrandRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListBrandsUseCase } from './list-brands.use-case.js';

// Test suite for listing car brands with pagination
describe('ListBrandsUseCase', () => {
	let useCase: ListBrandsUseCase;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;

	beforeEach(() => {
		mockBrandRepository = createMockBrandRepository();
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		useCase = container.resolve(ListBrandsUseCase);
	});

	// Happy path: returns brands with default pagination meta
	it('should return paginated list of brands', async () => {
		const brands = [{ id: '1', name: 'Toyota' }, { id: '2', name: 'Honda' }];
		mockBrandRepository.findAll.mockResolvedValue(ok({ data: brands, total: 2 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(brands);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
		}
	});

	// Edge case: empty dataset returns zero totalPages
	it('should return empty array when no brands', async () => {
		mockBrandRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	// Verifies database errors bubble up unchanged
	it('should propagate repository error', async () => {
		mockBrandRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute();

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});

	// Verifies page/limit are converted to skip/take for the repository
	it('should pass pagination params to repository', async () => {
		mockBrandRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));

		await useCase.execute({ page: 2, limit: 10 });

		expect(mockBrandRepository.findAll).toHaveBeenCalledWith({ skip: 10, take: 10 });
	});

	// Verifies pagination metadata calculation with custom page and limit
	it('should return correct meta with custom pagination', async () => {
		const brands = [{ id: '1', name: 'Toyota' }];
		mockBrandRepository.findAll.mockResolvedValue(ok({ data: brands, total: 25 }));

		const result = await useCase.execute({ page: 3, limit: 10 });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.meta).toEqual({ page: 3, limit: 10, total: 25, totalPages: 3 });
		}
	});
});
