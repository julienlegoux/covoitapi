import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCityRepository } from '../../../../tests/setup.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { CreateCityUseCase } from './create-city.use-case.js';

describe('CreateCityUseCase', () => {
	let useCase: CreateCityUseCase;
	let mockCityRepository: ReturnType<typeof createMockCityRepository>;

	beforeEach(() => {
		mockCityRepository = createMockCityRepository();
		container.registerInstance(TOKENS.CityRepository, mockCityRepository);
		useCase = container.resolve(CreateCityUseCase);
	});

	it('should create city successfully', async () => {
		const city = { id: '1', cityName: 'Paris', zipcode: '75000' };
		mockCityRepository.create.mockResolvedValue(ok(city));

		const result = await useCase.execute({ cityName: 'Paris', zipcode: '75000' });

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(city);
		expect(mockCityRepository.create).toHaveBeenCalledWith({ cityName: 'Paris', zipcode: '75000' });
	});

	it('should propagate repository error', async () => {
		mockCityRepository.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ cityName: 'Paris', zipcode: '75000' });
		expect(result.success).toBe(false);
	});
});
