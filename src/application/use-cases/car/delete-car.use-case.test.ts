/**
 * @file Unit tests for the DeleteCarUseCase.
 *
 * Covers successful deletion, not-found guard, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockLogger } from '../../../../tests/setup.js';
import { CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteCarUseCase } from './delete-car.use-case.js';

// Test suite for deleting cars by UUID
describe('DeleteCarUseCase', () => {
	let useCase: DeleteCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteCarUseCase);
	});

	// Happy path: car exists and is deleted
	it('should delete car successfully', async () => {
		mockCarRepository.findById.mockResolvedValue(ok({ id: '1', licensePlate: 'AB-123-CD', modelId: 'm1' }));
		mockCarRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockCarRepository.delete).toHaveBeenCalledWith('1');
	});

	// Not-found guard: missing car returns CarNotFoundError and skips delete
	it('should return CarNotFoundError when car not found', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up and skips delete
	it('should propagate repository error from findById', async () => {
		mockCarRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});
});
