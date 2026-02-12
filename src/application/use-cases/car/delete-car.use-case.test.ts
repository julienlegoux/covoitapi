/**
 * @file Unit tests for the DeleteCarUseCase.
 *
 * Covers successful deletion, not-found guard, ownership verification,
 * and repository error propagation.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCarRepository, createMockUserRepository, createMockDriverRepository, createMockLogger } from '../../../../tests/setup.js';
import { CarNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { DeleteCarUseCase } from './delete-car.use-case.js';

// Test suite for deleting cars by UUID with ownership check
describe('DeleteCarUseCase', () => {
	let useCase: DeleteCarUseCase;
	let mockCarRepository: ReturnType<typeof createMockCarRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;

	const user = { id: 'user-1', refId: 1, firstName: 'John', lastName: 'Doe', phone: '0600000000' };
	const driver = { id: 'driver-1', refId: 1, userRefId: 1, licenseNumber: 'LIC-001' };
	const car = { id: 'car-1', refId: 1, licensePlate: 'AB-123-CD', modelRefId: 10, driverRefId: 1 };

	beforeEach(() => {
		mockCarRepository = createMockCarRepository();
		mockUserRepository = createMockUserRepository();
		mockDriverRepository = createMockDriverRepository();
		container.registerInstance(TOKENS.CarRepository, mockCarRepository);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(DeleteCarUseCase);
	});

	function mockDriverResolution() {
		mockUserRepository.findById.mockResolvedValue(ok(user));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(driver));
	}

	// Happy path: car exists, owner matches, car is deleted
	it('should delete car successfully', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(car));
		mockDriverResolution();
		mockCarRepository.delete.mockResolvedValue(ok(undefined));

		const result = await useCase.execute({ id: 'car-1', userId: 'user-1' });
		expect(result.success).toBe(true);
		expect(mockCarRepository.delete).toHaveBeenCalledWith('car-1');
	});

	// Not-found guard: missing car returns CarNotFoundError and skips delete
	it('should return CarNotFoundError when car not found', async () => {
		mockCarRepository.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute({ id: '999', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});

	// Ownership check: different driver returns ForbiddenError
	it('should return ForbiddenError when user does not own the car', async () => {
		const otherDriverCar = { ...car, driverRefId: 99 };
		mockCarRepository.findById.mockResolvedValue(ok(otherDriverCar));
		mockDriverResolution();

		const result = await useCase.execute({ id: 'car-1', userId: 'user-1' });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(ForbiddenError);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});

	// DB error during lookup bubbles up and skips delete
	it('should propagate repository error from findById', async () => {
		mockCarRepository.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute({ id: 'car-1', userId: 'user-1' });
		expect(result.success).toBe(false);
		expect(mockCarRepository.delete).not.toHaveBeenCalled();
	});
});
