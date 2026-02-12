/**
 * @file Unit tests for the GetTravelUseCase.
 *
 * Covers successful retrieval, not-found guard, and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockTravelRepository } from '../../../../tests/setup.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { GetTravelUseCase } from './get-travel.use-case.js';

// Test suite for retrieving a single travel by UUID
describe('GetTravelUseCase', () => {
	let useCase: GetTravelUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;

	const travel = { id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' };

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		useCase = container.resolve(GetTravelUseCase);
	});

	// Happy path: travel exists and is returned
	it('should return travel when found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(travel));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(travel);
	});

	// Not-found guard: null lookup returns TravelNotFoundError
	it('should return TravelNotFoundError when not found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TravelNotFoundError);
	});

	// DB error during lookup bubbles up
	it('should propagate repository error', async () => {
		mockTravelRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});
});
