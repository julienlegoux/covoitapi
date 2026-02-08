import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRouteRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { FindRouteUseCase } from './find-route.use-case.js';

describe('FindRouteUseCase', () => {
	let useCase: FindRouteUseCase;
	let mockRouteRepository: ReturnType<typeof createMockRouteRepository>;

	beforeEach(() => {
		mockRouteRepository = createMockRouteRepository();
		container.registerInstance(TOKENS.RouteRepository, mockRouteRepository);
		useCase = container.resolve(FindRouteUseCase);
	});

	it('should find routes with all filters', async () => {
		const routes = [{ id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' }];
		mockRouteRepository.findByFilters.mockResolvedValue(ok(routes));

		const result = await useCase.execute({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });

		expect(result.success).toBe(true);
		expect(mockRouteRepository.findByFilters).toHaveBeenCalledWith({
			departureCity: 'Paris',
			arrivalCity: 'Lyon',
			date: new Date('2025-06-15'),
		});
	});

	it('should find routes with partial filters', async () => {
		mockRouteRepository.findByFilters.mockResolvedValue(ok([]));

		await useCase.execute({ departureCity: 'Paris' });

		expect(mockRouteRepository.findByFilters).toHaveBeenCalledWith({
			departureCity: 'Paris',
			arrivalCity: undefined,
			date: undefined,
		});
	});

	it('should return empty array when no routes match', async () => {
		mockRouteRepository.findByFilters.mockResolvedValue(ok([]));
		const result = await useCase.execute({ departureCity: 'Nowhere' });
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockRouteRepository.findByFilters.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ departureCity: 'Paris' });
		expect(result.success).toBe(false);
	});
});
