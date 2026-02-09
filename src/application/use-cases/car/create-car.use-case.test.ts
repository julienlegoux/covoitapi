import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockModelRepository, createMockBrandRepository } from '../../../../tests/setup.js';
import { CarAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateCarUseCase } from './create-car.use-case.js';

describe('CreateCarUseCase', () => {
	let useCase: CreateCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;
	let mockModelRepository: ReturnType<typeof createMockModelRepository>;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;

	const validInput = { modele: 'Corolla', marqueId: 'brand-1', immatriculation: 'AB-123-CD' };
	const brand = { id: 'brand-1', refId: 5, name: 'Toyota' };

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		mockModelRepository = createMockModelRepository();
		mockBrandRepository = createMockBrandRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.ModelRepository, mockModelRepository);
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		useCase = container.resolve(CreateCarUseCase);
	});

	it('should create car with existing model', async () => {
		const model = { id: 'model-1', refId: 10, name: 'Corolla', brandRefId: 5 };
		const car = { id: 'car-1', refId: 1, immat: 'AB-123-CD', modelRefId: 10 };
		mockCarRepository.existsByImmat.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(model));
		mockCarRepository.create.mockResolvedValue(ok(car));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(car);
		expect(mockCarRepository.create).toHaveBeenCalledWith({ immat: 'AB-123-CD', modelRefId: 10 });
	});

	it('should create car and new model when model not found', async () => {
		const newModel = { id: 'model-new', refId: 11, name: 'Corolla', brandRefId: 5 };
		const car = { id: 'car-1', refId: 1, immat: 'AB-123-CD', modelRefId: 11 };
		mockCarRepository.existsByImmat.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(ok(newModel));
		mockCarRepository.create.mockResolvedValue(ok(car));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockModelRepository.create).toHaveBeenCalledWith({ name: 'Corolla', brandRefId: 5 });
	});

	it('should return CarAlreadyExistsError when immat exists', async () => {
		mockCarRepository.existsByImmat.mockResolvedValue(ok(true));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarAlreadyExistsError);
		expect(mockCarRepository.create).not.toHaveBeenCalled();
	});

	it('should propagate error from existsByImmat', async () => {
		mockCarRepository.existsByImmat.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from findByNameAndBrand', async () => {
		mockCarRepository.existsByImmat.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from model create', async () => {
		mockCarRepository.existsByImmat.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});
});
