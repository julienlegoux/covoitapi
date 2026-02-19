/**
 * @file Unit tests for the DeleteTripUseCase.
 *
 * Covers successful deletion, trip not found, driver not found, ownership
 * verification (ForbiddenError), and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockDriverRepository,
	createMockLogger,
	createMockTripRepository,
} from '../../../../tests/setup.js';
import { DriverNotFoundError, ForbiddenError, TripNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DeleteTripUseCase } from './delete-trip.use-case.js';

describe('DeleteTripUseCase', () => {
	let useCase: DeleteTripUseCase;
	let mockTripRepo: ReturnType<typeof createMockTripRepository>;
	let mockDriverRepo: ReturnType<typeof createMockDriverRepository>;

	const trip = { id: 'trip-1', refId: 1, dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 10, carRefId: 20 };
	const driver = { id: 'driver-1', refId: 10, userId: 1, licenseNumber: 'ABC123', anonymizedAt: null, createdAt: new Date(), updatedAt: new Date() };
	const validInput = { id: 'trip-1', userId: 'user-1' };

	beforeEach(() => {
		mockTripRepo = createMockTripRepository();
		mockDriverRepo = createMockDriverRepository();
		container.registerInstance(TOKENS.TripRepository, mockTripRepo);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteTripUseCase);
	});

	// Happy path: trip exists, driver owns it, deletion succeeds
	it('should delete trip when driver owns it', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(trip));
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockTripRepo.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockTripRepo.delete).toHaveBeenCalledWith('trip-1');
	});

	// Trip UUID does not exist
	it('should return TripNotFoundError when trip does not exist', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TripNotFoundError);
	});

	// Authenticated user has no driver profile
	it('should return DriverNotFoundError when driver does not exist', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(trip));
		mockDriverRepo.findByUserId.mockResolvedValue(ok(null));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DriverNotFoundError);
	});

	// Security-critical: driver cannot delete another driver's trip
	it('should return ForbiddenError when driver does not own the trip', async () => {
		const otherDriver = { ...driver, refId: 999 };
		mockTripRepo.findById.mockResolvedValue(ok(trip));
		mockDriverRepo.findByUserId.mockResolvedValue(ok(otherDriver));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ForbiddenError);
		expect(mockTripRepo.delete).not.toHaveBeenCalled();
	});

	// DB error during trip lookup propagates
	it('should propagate error from tripRepository.findById', async () => {
		mockTripRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});

	// DB error during deletion propagates
	it('should propagate error from tripRepository.delete', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(trip));
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockTripRepo.delete.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
