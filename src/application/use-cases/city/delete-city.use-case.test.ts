import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCityRepository } from '../../../../tests/setup.js';
import { CityNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteCityUseCase } from './delete-city.use-case.js';

describe('DeleteCityUseCase', () => {
	let useCase: DeleteCityUseCase;
	let mockCityRepository: ReturnType<typeof createMockCityRepository>;

	beforeEach(() => {
		mockCityRepository = createMockCityRepository();
		container.registerInstance(TOKENS.CityRepository, mockCityRepository);
		useCase = container.resolve(DeleteCityUseCase);
	});

	it('should delete city successfully', async () => {
		mockCityRepository.findById.mockResolvedValue(ok({ id: '1', cityName: 'Paris', zipcode: '75000' }));
		mockCityRepository.delete.mockResolvedValue(ok(undefined));
		const result = await useCase.execute('1');
		expect(result.success).toBe(true);
		expect(mockCityRepository.delete).toHaveBeenCalledWith('1');
	});

	it('should return CityNotFoundError when not found', async () => {
		mockCityRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CityNotFoundError);
		expect(mockCityRepository.delete).not.toHaveBeenCalled();
	});

	it('should propagate repository error', async () => {
		mockCityRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1');
		expect(result.success).toBe(false);
	});
});
