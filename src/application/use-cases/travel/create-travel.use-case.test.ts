import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockTravelRepository, createMockDriverRepository, createMockCityRepository, createMockUserRepository, createMockCarRepository } from '../../../../tests/setup.js';
import { DriverNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateTravelUseCase } from './create-travel.use-case.js';

describe('CreateTravelUseCase', () => {
	let useCase: CreateTravelUseCase;
	let mockTravelRepo: ReturnType<typeof createMockTravelRepository>;
	let mockDriverRepo: ReturnType<typeof createMockDriverRepository>;
	let mockCityRepo: ReturnType<typeof createMockCityRepository>;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;
	let mockCarRepo: ReturnType<typeof createMockCarRepository>;

	const validInput = { kms: 150, userId: 'user-1', date: '2025-06-15', departureCity: 'Paris', arrivalCity: 'Lyon', seats: 3, carId: 'car-1' };
	const user = { id: 'user-1', refId: 1, authRefId: 10, firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'test@example.com', anonymizedAt: null, createdAt: new Date(), updatedAt: new Date() };
	const driver = { id: 'driver-1', refId: 2, driverLicense: 'DL123', userRefId: 1, anonymizedAt: null };
	const car = { id: 'car-1', refId: 3, licensePlate: 'AB-123-CD', modelRefId: 10 };

	beforeEach(() => {
		mockTravelRepo = createMockTravelRepository();
		mockDriverRepo = createMockDriverRepository();
		mockCityRepo = createMockCityRepository();
		mockUserRepo = createMockUserRepository();
		mockCarRepo = createMockCarRepository();
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepo);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepo);
		container.registerInstance(TOKENS.CityRepository, mockCityRepo);
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.CarRepository, mockCarRepo);
		useCase = container.resolve(CreateTravelUseCase);
	});

	it('should create travel with existing cities', async () => {
		const parisCity = { id: 'city-1', refId: 20, cityName: 'Paris', zipcode: '75000' };
		const lyonCity = { id: 'city-2', refId: 21, cityName: 'Lyon', zipcode: '69000' };
		const travel = { id: 'r1', refId: 1, dateRoute: new Date('2025-06-15'), kms: 150, seats: 3, driverRefId: 2, carRefId: 3 };

		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(parisCity)).mockResolvedValueOnce(ok(lyonCity));
		mockTravelRepo.create.mockResolvedValue(ok(travel));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockTravelRepo.create).toHaveBeenCalledWith({
			dateRoute: new Date('2025-06-15'),
			kms: 150,
			seats: 3,
			driverRefId: 2,
			carRefId: 3,
			cityRefIds: [20, 21],
		});
	});

	it('should create travel with new cities', async () => {
		const newParis = { id: 'city-new-1', refId: 30, cityName: 'Paris', zipcode: '' };
		const newLyon = { id: 'city-new-2', refId: 31, cityName: 'Lyon', zipcode: '' };
		const travel = { id: 'r1', refId: 1, dateRoute: new Date('2025-06-15'), kms: 150, seats: 3, driverRefId: 2, carRefId: 3 };

		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValue(ok(null));
		mockCityRepo.create.mockResolvedValueOnce(ok(newParis)).mockResolvedValueOnce(ok(newLyon));
		mockTravelRepo.create.mockResolvedValue(ok(travel));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockCityRepo.create).toHaveBeenCalledTimes(2);
	});

	it('should return DriverNotFoundError when driver not found', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(ok(null));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DriverNotFoundError);
	});

	it('should propagate error from driverRepository.findByUserRefId', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from cityRepository.findByCityName', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	it('should propagate error from travelRepository.create', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockDriverRepo.findByUserRefId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValue(ok({ id: 'c1', refId: 40, cityName: 'Paris', zipcode: '75000' }));
		mockTravelRepo.create.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});
});
