import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockTravelRepository } from '../../../../tests/setup.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { GetTravelUseCase } from './get-travel.use-case.js';

describe('GetTravelUseCase', () => {
	let useCase: GetTravelUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;

	const travel = { id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' };

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		useCase = container.resolve(GetTravelUseCase);
	});

	it('should return travel when found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(travel));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(travel);
	});

	it('should return TravelNotFoundError when not found', async () => {
		mockTravelRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TravelNotFoundError);
	});

	it('should propagate repository error', async () => {
		mockTravelRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});
});
