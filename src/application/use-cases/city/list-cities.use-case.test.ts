import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCityRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { ListCitiesUseCase } from './list-cities.use-case.js';

describe('ListCitiesUseCase', () => {
	let useCase: ListCitiesUseCase;
	let mockCityRepository: ReturnType<typeof createMockCityRepository>;

	beforeEach(() => {
		mockCityRepository = createMockCityRepository();
		container.registerInstance(TOKENS.CityRepository, mockCityRepository);
		useCase = container.resolve(ListCitiesUseCase);
	});

	it('should return list of cities', async () => {
		const cities = [{ id: '1', cityName: 'Paris', zipcode: '75000' }];
		mockCityRepository.findAll.mockResolvedValue(ok(cities));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(cities);
	});

	it('should return empty array', async () => {
		mockCityRepository.findAll.mockResolvedValue(ok([]));
		const result = await useCase.execute();
		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual([]);
	});

	it('should propagate repository error', async () => {
		mockCityRepository.findAll.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute();
		expect(result.success).toBe(false);
	});
});
