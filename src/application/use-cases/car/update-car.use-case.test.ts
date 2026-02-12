/**
 * @file Unit tests for the UpdateCarUseCase.
 *
 * Covers partial updates (license plate only, model resolution with existing
 * and new models), ownership verification, not-found guard, and repository
 * error propagation from car, model, brand, user, and driver repositories.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockModelRepository, createMockBrandRepository, createMockUserRepository, createMockDriverRepository, createMockLogger } from '../../../../tests/setup.js';
import { CarNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { UpdateCarUseCase } from './update-car.use-case.js';

// Test suite for partial car updates with model resolution and ownership check
describe('UpdateCarUseCase', () => {
	let useCase: UpdateCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;
	let mockModelRepository: ReturnType<typeof createMockModelRepository>;
	let mockBrandRepository: ReturnType<typeof createMockBrandRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;

	const existingCar = { id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 10, driverRefId: 1 };
	const brand = { id: 'brand-1', refId: 5, name: 'Toyota' };
	const user = { id: 'user-1', refId: 1, firstName: 'John', lastName: 'Doe', phone: '0600000000' };
	const driver = { id: 'driver-1', refId: 1, userRefId: 1, licenseNumber: 'LIC-001' };

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		mockModelRepository = createMockModelRepository();
		mockBrandRepository = createMockBrandRepository();
		mockUserRepository = createMockUserRepository();
		mockDriverRepository = createMockDriverRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.ModelRepository, mockModelRepository);
		container.registerInstance(TOKENS.BrandRepository, mockBrandRepository);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(UpdateCarUseCase);
	});

	function mockDriverResolution() {
		mockUserRepository.findById.mockResolvedValue(ok(user));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(driver));
	}

	// Partial update: only license plate, no model resolution needed
	it('should update car with licensePlate only', async () => {
		const updated = { ...existingCar, licensePlate: 'XY-999-ZZ' };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockDriverResolution();
		mockCarRepository.update.mockResolvedValue(ok(updated));

		const result = await useCase.execute('car-1', { licensePlate: 'XY-999-ZZ' }, 'user-1');

		expect(result.success).toBe(true);
		expect(mockCarRepository.update).toHaveBeenCalledWith('car-1', { licensePlate: 'XY-999-ZZ' });
	});

	// Model update: existing model found for brand, its refId is used
	it('should update car with model resolution (existing model)', async () => {
		const model = { id: 'model-1', refId: 10, name: 'Yaris', brandRefId: 5 };
		const updated = { ...existingCar, modelRefId: 10 };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockDriverResolution();
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(model));
		mockCarRepository.update.mockResolvedValue(ok(updated));

		const result = await useCase.execute('car-1', { model: 'Yaris', brandId: 'brand-1' }, 'user-1');

		expect(result.success).toBe(true);
		expect(mockCarRepository.update).toHaveBeenCalledWith('car-1', { modelRefId: 10 });
	});

	// Model update: model does not exist, auto-created with new refId
	it('should update car with model resolution (new model)', async () => {
		const newModel = { id: 'model-new', refId: 11, name: 'Yaris', brandRefId: 5 };
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockDriverResolution();
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(ok(null));
		mockModelRepository.create.mockResolvedValue(ok(newModel));
		mockCarRepository.update.mockResolvedValue(ok({ ...existingCar, modelRefId: 11 }));

		const result = await useCase.execute('car-1', { model: 'Yaris', brandId: 'brand-1' }, 'user-1');

		expect(result.success).toBe(true);
		expect(mockModelRepository.create).toHaveBeenCalledWith({ name: 'Yaris', brandRefId: 5 });
	});

	// Ownership check: different driver returns ForbiddenError
	it('should return ForbiddenError when user does not own the car', async () => {
		const otherDriverCar = { ...existingCar, driverRefId: 99 };
		mockCarRepository.findById.mockResolvedValue(ok(otherDriverCar));
		mockDriverResolution();

		const result = await useCase.execute('car-1', { licensePlate: 'XY-999-ZZ' }, 'user-1');

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ForbiddenError);
		expect(mockCarRepository.update).not.toHaveBeenCalled();
	});

	// Not-found guard: missing car returns CarNotFoundError
	it('should return CarNotFoundError when car not found', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute('999', { licensePlate: 'XX' }, 'user-1');
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
	});

	// DB error during car lookup bubbles up
	it('should propagate error from findById', async () => {
		mockCarRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('1', { licensePlate: 'XX' }, 'user-1');
		expect(result.success).toBe(false);
	});

	// DB error during model lookup within model resolution bubbles up
	it('should propagate error from findByNameAndBrand', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(existingCar));
		mockDriverResolution();
		mockBrandRepository.findById.mockResolvedValue(ok(brand));
		mockModelRepository.findByNameAndBrand.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute('car-1', { model: 'Yaris', brandId: 'brand-1' }, 'user-1');
		expect(result.success).toBe(false);
	});
});
