import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockRouteRepository, createMockDriverRepository, createMockCityRepository } from '../../../../tests/setup.js';
import { DriverNotFoundError } from '../../../domain/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { CreateRouteUseCase } from './create-route.use-case.js';

describe('CreateRouteUseCase', () => {
	let useCase: CreateRouteUseCase;
	let mockRouteRepo: ReturnType<typeof createMockRouteRepository>;
	let mockDriverRepo: ReturnType<typeof createMockDriverRepository>;
	let mockCityRepo: ReturnType<typeof createMockCityRepository>;

	const validInput = { kms: 150, idpers: 'user-1', dateT: '2025-06-15', villeD: 'Paris', villeA: 'Lyon', seats: 3, carId: 'car-1' };
	const driver = { id: 'driver-1', driverLicense: 'DL123', userId: 'user-1' };

	beforeEach(() => {
		mockRouteRepo = createMockRouteRepository();
		mockDriverRepo = createMockDriverRepository();
		mockCityRepo = createMockCityRepository();
		container.registerInstance(TOKENS.RouteRepository, mockRouteRepo);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepo);
		container.registerInstance(TOKENS.CityRepository, mockCityRepo);
		useCase = container.resolve(CreateRouteUseCase);
	});

	it('should create route with existing cities', async () => {
		const parisCity = { id: 'city-1', cityName: 'Paris', zipcode: '75000' };
		const lyonCity = { id: 'city-2', cityName: 'Lyon', zipcode: '69000' };
		const route = { id: 'r1', dateRoute: new Date('2025-06-15'), kms: 150, seats: 3, driverId: 'driver-1', carId: 'car-1' };

		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(parisCity)).mockResolvedValueOnce(ok(lyonCity));
		mockRouteRepo.create.mockResolvedValue(ok(route));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockRouteRepo.create).toHaveBeenCalledWith({
			dateRoute: new Date('2025-06-15'),
			kms: 150,
			seats: 3,
			driverId: 'driver-1',
			carId: 'car-1',
			cityIds: ['city-1', 'city-2'],
		});
	});

	it('should create route with new cities', async () => {
		const newParis = { id: 'city-new-1', cityName: 'Paris', zipcode: '' };
		const newLyon = { id: 'city-new-2', cityName: 'Lyon', zipcode: '' };
		const route = { id: 'r1', dateRoute: new Date('2025-06-15'), kms: 150, seats: 3, driverId: 'driver-1', carId: 'car-1' };

		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCityRepo.findByCityName.mockResolvedValue(ok(null));
		mockCityRepo.create.mockResolvedValueOnce(ok(newParis)).mockResolvedValueOnce(ok(newLyon));
		mockRouteRepo.create.mockResolvedValue(ok(route));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockCityRepo.create).toHaveBeenCalledTimes(2);
	});

	it('should return DriverNotFoundError when driver not found', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(null));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DriverNotFoundError);
	});

	it('should propagate error from driverRepository.findByUserId', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from cityRepository.findByCityName', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCityRepo.findByCityName.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from routeRepository.create', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCityRepo.findByCityName.mockResolvedValue(ok({ id: 'c1', cityName: 'Paris', zipcode: '75000' }));
		mockRouteRepo.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});
});
