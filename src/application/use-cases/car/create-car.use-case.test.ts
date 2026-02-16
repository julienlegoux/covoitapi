/**
 * @file Unit tests for the CreateCarUseCase.
 *
 * Covers car creation with existing model, car creation with auto-created model,
 * duplicate license plate rejection, driver resolution, and repository error
 * propagation from each dependency (car, model, brand, driver repositories).
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockModelRepository, createMockBrandRepository, createMockDriverRepository, createMockLogger } from '../../../../tests/setup.js';
import { CarAlreadyExistsError, DriverNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateCarUseCase } from './create-car.use-case.js';

// Test suite for creating cars with brand/model resolution and driver ownership
describe('CreateCarUseCase', () => {
	let useCase: CreateCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;
	let mockModelRepository: ReturnType<typeof createMockModelRepository>;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;

	const validInput = { model: 'Corolla', brandId: 'brand-1', licensePlate: 'AB-123-CD', userId: 'user-1' };
	const brand = { id: 'brand-1', refId: 5, name: 'Toyota' };
	const driver = { id: 'driver-1', refId: 1, userRefId: 1, licenseNumber: 'LIC-001' };

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		mockModelRepository = createMockModelRepository();
		mockBrandRepository = createMockBrandRepository();
		mockDriverRepository = createMockDriverRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.ModelRepository, mockModelRepository);
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(CreateCarUseCase);
	});

	// Helper to set up successful driver resolution mocks
	function mockDriverResolution() {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(driver));
	}

	// Happy path: model already exists for the brand, car is created with its refId
	it('should create car with existing model', async () => {
		mockDriverResolution();
		const model = { id: 'model-1', refId: 10, name: 'Corolla', brandRefId: 5 };
		const car = { id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 10, driverRefId: 1 };
		mockCarRepository.existsByLicensePlate.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(model));
		mockCarRepository.create.mockResolvedValue(ok(car));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(car);
		expect(mockCarRepository.create).toHaveBeenCalledWith({ licensePlate: 'AB-123-CD', modelRefId: 10, driverRefId: 1 });
	});

	// Model does not exist yet: auto-creates it, then creates the car
	it('should create car and new model when model not found', async () => {
		mockDriverResolution();
		const newModel = { id: 'model-new', refId: 11, name: 'Corolla', brandRefId: 5 };
		const car = { id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 11, driverRefId: 1 };
		mockCarRepository.existsByLicensePlate.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(ok(newModel));
		mockCarRepository.create.mockResolvedValue(ok(car));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockModelRepository.create).toHaveBeenCalledWith({ name: 'Corolla', brandRefId: 5 });
	});

	// Duplicate license plate is rejected before any model or brand lookup
	it('should return CarAlreadyExistsError when license plate exists', async () => {
		mockDriverResolution();
		mockCarRepository.existsByLicensePlate.mockResolvedValue(ok(true));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarAlreadyExistsError);
		expect(mockCarRepository.create).not.toHaveBeenCalled();
	});

	// No driver profile: returns DriverNotFoundError
	it('should return DriverNotFoundError when user has no driver profile', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(null));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DriverNotFoundError);
		expect(mockCarRepository.create).not.toHaveBeenCalled();
	});

	// Verifies DB error during license plate check bubbles up
	it('should propagate error from existsByLicensePlate', async () => {
		mockDriverResolution();
		mockCarRepository.existsByLicensePlate.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	// Verifies DB error during model lookup bubbles up
	it('should propagate error from findByNameAndBrand', async () => {
		mockDriverResolution();
		mockCarRepository.existsByLicensePlate.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	// Verifies DB error during model auto-creation bubbles up
	it('should propagate error from model create', async () => {
		mockDriverResolution();
		mockCarRepository.existsByLicensePlate.mockResolvedValue(ok(false));
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});
});
