/**
 * @file Unit tests for the DeleteTravelUseCase.
 *
 * Covers successful deletion, not-found guard, ownership verification,
 * and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTravelRepository, createMockDriverRepository } from '../../../../tests/setup.js';
import { TravelNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteTravelUseCase } from './delete-travel.use-case.js';

// Test suite for deleting carpooling travels with ownership check
describe('DeleteTravelUseCase', () => {
	let useCase: DeleteTravelUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;

	const driver = { id: 'driver-1', refId: 1, userRefId: 1, licenseNumber: 'LIC-001' };
	const travel = { id: 'r1', refId: 1, dateRoute: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 };

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		mockDriverRepository = createMockDriverRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteTravelUseCase);
	});

	function mockDriverResolution() {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(driver));
	}

	// Happy path: travel exists, owner matches, travel is deleted
	it('should delete travel successfully', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(travel));
		mockDriverResolution();
		mockTravelRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute({ id: 'r1', userId: 'user-1' });
		expect(result.success).toBe(true);
		expect(mockTravelRepository.delete).toHaveBeenCalledWith('r1');
	});

	// Not-found guard: null lookup returns TravelNotFoundError
	it('should return TravelNotFoundError when not found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute({ id: '999', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TravelNotFoundError);
		expect(mockTravelRepository.delete).not.toHaveBeenCalled();
	});

	// Ownership check: different driver returns ForbiddenError
	it('should return ForbiddenError when user does not own the travel', async () => {
		const otherDriverTravel = { ...travel, driverRefId: 99 };
		mockTravelRepository.findById.mockResolvedValue(ok(otherDriverTravel));
		mockDriverResolution();

		const result = await useCase.execute({ id: 'r1', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ForbiddenError);
		expect(mockTravelRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockTravelRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ id: 'r1', userId: 'user-1' });
		expect(result.success).toBe(false);
	});
});
