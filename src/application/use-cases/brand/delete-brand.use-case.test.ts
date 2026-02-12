/**
 * @file Unit tests for the DeleteBrandUseCase.
 *
 * Covers successful deletion, not-found error when brand does not exist,
 * and repository error propagation from both findById and delete operations.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockBrandRepository, createMockLogger } from '../../../../tests/setup.js';
import { BrandNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteBrandUseCase } from './delete-brand.use-case.js';

// Test suite for deleting car brands by UUID
describe('DeleteBrandUseCase', () => {
	let useCase: DeleteBrandUseCase;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;

	beforeEach(() => {
		mockBrandRepository = createMockBrandRepository();
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteBrandUseCase);
	});

	// Happy path: brand exists and is deleted
	it('should delete brand successfully when found', async () => {
		mockBrandRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Toyota' }));
		mockBrandRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute('1');

		expect(result.success).toBe(true);
		expect(mockBrandRepository.delete).toHaveBeenCalledWith('1');
	});

	// Verifies not-found guard: null lookup returns BrandNotFoundError
	it('should return BrandNotFoundError when brand does not exist', async () => {
		mockBrandRepository.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('999');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(BrandNotFoundError);
		expect(mockBrandRepository.delete).not.toHaveBeenCalled();
	});

	// Verifies DB error during lookup bubbles up and skips delete
	it('should propagate repository error from findById', async () => {
		mockBrandRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute('1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
		expect(mockBrandRepository.delete).not.toHaveBeenCalled();
	});

	// Verifies DB error during actual deletion bubbles up
	it('should propagate repository error from delete', async () => {
		mockBrandRepository.findById.mockResolvedValue(ok({ id: '1', name: 'Toyota' }));
		mockBrandRepository.delete.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute('1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
