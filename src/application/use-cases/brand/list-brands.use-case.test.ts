import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockBrandRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListBrandsUseCase } from './list-brands.use-case.js';

describe('ListBrandsUseCase', () => {
	let useCase: ListBrandsUseCase;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;

	beforeEach(() => {
		mockBrandRepository = createMockBrandRepository();
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		useCase = container.resolve(ListBrandsUseCase);
	});

	it('should return list of brands', async () => {
		const brands = [{ id: '1', name: 'Toyota' }, { id: '2', name: 'Honda' }];
		mockBrandRepository.findAll.mockResolvedValue(ok(brands));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(brands);
	});

	it('should return empty array when no brands', async () => {
		mockBrandRepository.findAll.mockResolvedValue(ok([]));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockBrandRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute();

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
