import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockModelRepository } from '../../../../tests/setup.js';
import { CarNotFoundError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { UpdateCarUseCase } from './update-car.use-case.js';

describe('UpdateCarUseCase', () => {
	let useCase: UpdateCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;
	let mockModelRepository: ReturnType<typeof createMockModelRepository>;

	const existingCar = { id: 'car-1', immat: 'AB-123-CD', modelId: 'model-1' };

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		mockModelRepository = createMockModelRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.ModelRepository, mockModelRepository);
		useCase = container.resolve(UpdateCarUseCase);
	});

	it('should update car with immatriculation only', async () => {
		const updated = { ...existingCar, immat: 'XY-999-ZZ' };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockCarRepository.update.mockResolvedValue(ok(updated));

		const result = await useCase.execute('car-1', { immatriculation: 'XY-999-ZZ' });

		expect(result.success).toBe(true);
		expect(mockCarRepository.update).toHaveBeenCalledWith('car-1', { immat: 'XY-999-ZZ' });
	});

	it('should update car with model resolution (existing model)', async () => {
		const model = { id: 'model-1', name: 'Yaris', brandId: 'brand-1' };
		const updated = { ...existingCar, modelId: 'model-1' };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(model));
		mockCarRepository.update.mockResolvedValue(ok(updated));

		const result = await useCase.execute('car-1', { modele: 'Yaris', marqueId: 'brand-1' });

		expect(result.success).toBe(true);
		expect(mockCarRepository.update).toHaveBeenCalledWith('car-1', { modelId: 'model-1' });
	});

	it('should update car with model resolution (new model)', async () => {
		const newModel = { id: 'model-new', name: 'Yaris', brandId: 'brand-1' };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(ok(newModel));
		mockCarRepository.update.mockResolvedValue(ok({ ...existingCar, modelId: 'model-new' }));

		const result = await useCase.execute('car-1', { modele: 'Yaris', marqueId: 'brand-1' });

		expect(result.success).toBe(true);
		expect(mockModelRepository.create).toHaveBeenCalledWith({ name: 'Yaris', brandId: 'brand-1' });
	});

	it('should return CarNotFoundError when car not found', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999', { immatriculation: 'XX' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
	});

	it('should propagate error from findById', async () => {
		mockCarRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1', { immatriculation: 'XX' });
		expect(result.success).toBe(false);
	});

	it('should propagate error from findByNameAndBrand', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('car-1', { modele: 'Yaris', marqueId: 'brand-1' });
		expect(result.success).toBe(false);
	});
});
