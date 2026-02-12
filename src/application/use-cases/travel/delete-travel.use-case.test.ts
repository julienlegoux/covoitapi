/**
 * @file Unit tests for the DeleteTravelUseCase.
 *
 * Covers successful deletion, not-found guard, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTravelRepository } from '../../../../tests/setup.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteTravelUseCase } from './delete-travel.use-case.js';

// Test suite for deleting carpooling travels
describe('DeleteTravelUseCase', () => {
	let useCase: DeleteTravelUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteTravelUseCase);
	});

	// Happy path: travel exists and is deleted
	it('should delete travel successfully', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok({ id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' }));
		mockTravelRepository.delete.mockResolvedValue(ok(undefined));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		expect(mockTravelRepository.delete).toHaveBeenCalledWith('r1');
	});

	// Not-found guard: null lookup returns TravelNotFoundError
	it('should return TravelNotFoundError when not found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TravelNotFoundError);
		expect(mockTravelRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockTravelRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});
});
