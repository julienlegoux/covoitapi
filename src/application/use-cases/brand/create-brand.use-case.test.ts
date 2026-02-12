/**
 * @file Unit tests for the CreateBrandUseCase.
 *
 * Covers successful brand creation and repository error propagation.
 * The brand repository is fully mocked.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockBrandRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateBrandUseCase } from './create-brand.use-case.js';

// Test suite for creating car brands
describe('CreateBrandUseCase', () => {
	let useCase: CreateBrandUseCase;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;

	beforeEach(() => {
		mockBrandRepository = createMockBrandRepository();
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		useCase = container.resolve(CreateBrandUseCase);
	});

	// Happy path: brand is persisted and returned
	it('should create brand successfully', async () => {
		const brand = { id: '1', name: 'Toyota' };
		mockBrandRepository.create.mockResolvedValue(ok(brand));

		const result = await useCase.execute({ name: 'Toyota' });

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(brand);
		expect(mockBrandRepository.create).toHaveBeenCalledWith({ name: 'Toyota' });
	});

	// Verifies that database errors bubble up unchanged
	it('should propagate repository error', async () => {
		mockBrandRepository.create.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute({ name: 'Toyota' });

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
