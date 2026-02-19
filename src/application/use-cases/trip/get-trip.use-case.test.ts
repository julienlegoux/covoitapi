/**
 * @file Unit tests for the GetTripUseCase.
 *
 * Covers successful retrieval, trip not found, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockLogger, createMockTripRepository } from '../../../../tests/setup.js';
import { TripNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { GetTripUseCase } from './get-trip.use-case.js';

describe('GetTripUseCase', () => {
	let useCase: GetTripUseCase;
	let mockTripRepo: ReturnType<typeof createMockTripRepository>;

	const trip = { id: 'trip-1', refId: 1, dateTrip: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 };

	beforeEach(() => {
		mockTripRepo = createMockTripRepository();
		container.registerInstance(TOKENS.TripRepository, mockTripRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(GetTripUseCase);
	});

	// Happy path: trip exists and is returned
	it('should return trip when found', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(trip));

		const result = await useCase.execute('trip-1');

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(trip);
	});

	// Trip UUID does not exist
	it('should return TripNotFoundError when trip does not exist', async () => {
		mockTripRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute('nonexistent');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TripNotFoundError);
	});

	// DB error propagates
	it('should propagate repository error', async () => {
		mockTripRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute('trip-1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});
});
