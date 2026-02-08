import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockTravelRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { ListTravelsUseCase } from './list-travels.use-case.js';

describe('ListTravelsUseCase', () => {
	let useCase: ListTravelsUseCase;
	let mockTravelRepository: ReturnType<typeof createMockTravelRepository>;

	beforeEach(() => {
		mockTravelRepository = createMockTravelRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepository);
		useCase = container.resolve(ListTravelsUseCase);
	});

	it('should return paginated list of travels', async () => {
		const travels = [{ id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' }];
		mockTravelRepository.findAll.mockResolvedValue(ok({ data: travels, total: 1 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(travels);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array', async () => {
		mockTravelRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockTravelRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});

	it('should pass pagination params to repository', async () => {
		mockTravelRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		await useCase.execute({ page: 2, limit: 10 });
		expect(mockTravelRepository.findAll).toHaveBeenCalledWith({ skip: 10, take: 10 });
	});
});
