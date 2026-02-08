import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRouteRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListRoutesUseCase } from './list-routes.use-case.js';

describe('ListRoutesUseCase', () => {
	let useCase: ListRoutesUseCase;
	let mockRouteRepository: ReturnType<typeof createMockRouteRepository>;

	beforeEach(() => {
		mockRouteRepository = createMockRouteRepository();
		container.registerInstance(TOKENS.RouteRepository, mockRouteRepository);
		useCase = container.resolve(ListRoutesUseCase);
	});

	it('should return paginated list of routes', async () => {
		const routes = [{ id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' }];
		mockRouteRepository.findAll.mockResolvedValue(ok({ data: routes, total: 1 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual(routes);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
		}
	});

	it('should return empty array', async () => {
		mockRouteRepository.findAll.mockResolvedValue(ok({ data: [], total: 0 }));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value.data).toEqual([]);
			expect(result.value.meta).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
		}
	});

	it('should propagate repository error', async () => {
		mockRouteRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});
});
