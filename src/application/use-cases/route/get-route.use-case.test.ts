import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRouteRepository } from '../../../../tests/setup.js';
import { RouteNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { GetRouteUseCase } from './get-route.use-case.js';

describe('GetRouteUseCase', () => {
	let useCase: GetRouteUseCase;
	let mockRouteRepository: ReturnType<typeof createMockRouteRepository>;

	const route = { id: 'r1', dateRoute: new Date(), kms: 100, seats: 3, driverId: 'd1', carId: 'c1' };

	beforeEach(() => {
		mockRouteRepository = createMockRouteRepository();
		container.registerInstance(TOKENS.RouteRepository, mockRouteRepository);
		useCase = container.resolve(GetRouteUseCase);
	});

	it('should return route when found', async () => {
		mockRouteRepository.findById.mockResolvedValue(ok(route));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(route);
	});

	it('should return RouteNotFoundError when not found', async () => {
		mockRouteRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(RouteNotFoundError);
	});

	it('should propagate repository error', async () => {
		mockRouteRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('r1');
		expect(result.success).toBe(false);
	});
});
