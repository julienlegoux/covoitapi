import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListCarsUseCase } from './list-cars.use-case.js';

describe('ListCarsUseCase', () => {
	let useCase: ListCarsUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		useCase = container.resolve(ListCarsUseCase);
	});

	it('should return list of cars', async () => {
		const cars = [{ id: '1', immat: 'AB-123-CD', modelId: 'm1' }];
		mockCarRepository.findAll.mockResolvedValue(ok(cars));

		const result = await useCase.execute();

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(cars);
	});

	it('should return empty array', async () => {
		mockCarRepository.findAll.mockResolvedValue(ok([]));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockCarRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});
});
