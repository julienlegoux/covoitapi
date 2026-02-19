/**
 * @file Unit tests for the CreateTripUseCase.
 *
 * Covers successful trip creation with existing cities, auto-creation of new
 * cities, mixed city scenarios, and error propagation from each repository
 * dependency (driver, car, city).
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockCarRepository,
	createMockCityRepository,
	createMockDriverRepository,
	createMockLogger,
	createMockTripRepository,
} from '../../../../tests/setup.js';
import { CarNotFoundError, DriverNotFoundError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { CreateTripUseCase } from './create-trip.use-case.js';

describe('CreateTripUseCase', () => {
	let useCase: CreateTripUseCase;
	let mockTripRepo: ReturnType<typeof createMockTripRepository>;
	let mockDriverRepo: ReturnType<typeof createMockDriverRepository>;
	let mockCarRepo: ReturnType<typeof createMockCarRepository>;
	let mockCityRepo: ReturnType<typeof createMockCityRepository>;

	const driver = { id: 'driver-1', refId: 10, userId: 1, licenseNumber: 'ABC123', anonymizedAt: null, createdAt: new Date(), updatedAt: new Date() };
	const car = { id: 'car-1', refId: 20, licensePlate: 'XX-123-YY', modelRefId: 1, driverRefId: 10 };
	const departureCity = { id: 'city-1', refId: 30, cityName: 'Paris', zipcode: '75000' };
	const arrivalCity = { id: 'city-2', refId: 31, cityName: 'Lyon', zipcode: '69000' };
	const trip = { id: 'trip-1', refId: 1, dateTrip: new Date('2025-06-15'), kms: 450, seats: 3, driverRefId: 10, carRefId: 20 };

	const validInput = {
		userId: 'user-1',
		date: '2025-06-15',
		kms: 450,
		seats: 3,
		carId: 'car-1',
		departureCity: 'Paris',
		arrivalCity: 'Lyon',
	};

	beforeEach(() => {
		mockTripRepo = createMockTripRepository();
		mockDriverRepo = createMockDriverRepository();
		mockCarRepo = createMockCarRepository();
		mockCityRepo = createMockCityRepository();
		container.registerInstance(TOKENS.TripRepository, mockTripRepo);
		container.registerInstance(TOKENS.DriverRepository, mockDriverRepo);
		container.registerInstance(TOKENS.CarRepository, mockCarRepo);
		container.registerInstance(TOKENS.CityRepository, mockCityRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(CreateTripUseCase);
	});

	// Happy path: both departure and arrival cities already exist in the database
	it('should create trip when both cities exist', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(departureCity));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(arrivalCity));
		mockTripRepo.create.mockResolvedValue(ok(trip));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(trip);
		expect(mockTripRepo.create).toHaveBeenCalledWith({
			dateTrip: new Date('2025-06-15'),
			kms: 450,
			seats: 3,
			driverRefId: 10,
			carRefId: 20,
			cityRefIds: [30, 31],
		});
		expect(mockCityRepo.create).not.toHaveBeenCalled();
	});

	// Both cities are new and must be auto-created with empty zipcode
	it('should auto-create both cities when neither exists', async () => {
		const newDeparture = { id: 'city-new-1', refId: 40, cityName: 'Paris', zipcode: '' };
		const newArrival = { id: 'city-new-2', refId: 41, cityName: 'Lyon', zipcode: '' };

		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(null));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(null));
		mockCityRepo.create.mockResolvedValueOnce(ok(newDeparture));
		mockCityRepo.create.mockResolvedValueOnce(ok(newArrival));
		mockTripRepo.create.mockResolvedValue(ok(trip));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockCityRepo.create).toHaveBeenCalledTimes(2);
		expect(mockCityRepo.create).toHaveBeenCalledWith({ cityName: 'Paris', zipcode: '' });
		expect(mockCityRepo.create).toHaveBeenCalledWith({ cityName: 'Lyon', zipcode: '' });
		expect(mockTripRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ cityRefIds: [40, 41] }),
		);
	});

	// Departure city exists, arrival city is new (mixed scenario)
	it('should find departure and auto-create arrival city', async () => {
		const newArrival = { id: 'city-new', refId: 42, cityName: 'Lyon', zipcode: '' };

		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(departureCity));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(null));
		mockCityRepo.create.mockResolvedValueOnce(ok(newArrival));
		mockTripRepo.create.mockResolvedValue(ok(trip));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockCityRepo.create).toHaveBeenCalledTimes(1);
		expect(mockTripRepo.create).toHaveBeenCalledWith(
			expect.objectContaining({ cityRefIds: [30, 42] }),
		);
	});

	// Driver not found for the authenticated user
	it('should return DriverNotFoundError when driver does not exist', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(null));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DriverNotFoundError);
	});

	// Car UUID does not resolve to any record
	it('should return CarNotFoundError when car does not exist', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(null));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(CarNotFoundError);
	});

	// DB error during driver lookup propagates
	it('should propagate error from driverRepository.findByUserId', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(err(new DatabaseError('db error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
	});

	// DB error during city creation propagates
	it('should propagate error from cityRepository.create', async () => {
		mockDriverRepo.findByUserId.mockResolvedValue(ok(driver));
		mockCarRepo.findById.mockResolvedValue(ok(car));
		mockCityRepo.findByCityName.mockResolvedValueOnce(ok(null));
		mockCityRepo.create.mockResolvedValueOnce(err(new DatabaseError('db error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(DatabaseError);
		expect(mockTripRepo.create).not.toHaveBeenCalled();
	});
});
