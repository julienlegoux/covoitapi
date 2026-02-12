/**
 * @file Unit tests for the CreateInscriptionUseCase.
 *
 * Covers successful passenger inscription, travel not found, duplicate
 * inscription, no seats available, and repository error propagation from
 * each dependency. Also verifies that seat availability is not checked
 * when the user is already inscribed.
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockInscriptionRepository, createMockLogger, createMockTravelRepository, createMockUserRepository } from '../../../../tests/setup.js';
import { AlreadyInscribedError, NoSeatsAvailableError, TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { CreateInscriptionUseCase } from './create-inscription.use-case.js';

// Test suite for passenger inscription creation with business rule validation
describe('CreateInscriptionUseCase', () => {
	let useCase: CreateInscriptionUseCase;
	let mockInscriptionRepo: ReturnType<typeof createMockInscriptionRepository>;
	let mockTravelRepo: ReturnType<typeof createMockTravelRepository>;
	let mockUserRepo: ReturnType<typeof createMockUserRepository>;

	const validInput = { userId: 'user-1', travelId: 'route-1' };
	const user = { id: 'user-1', refId: 1, authRefId: 10, firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'test@example.com', anonymizedAt: null, createdAt: new Date(), updatedAt: new Date() };
	const route = { id: 'route-1', refId: 2, dateRoute: new Date(), kms: 100, seats: 3, driverRefId: 1, carRefId: 1 };

	beforeEach(() => {
		mockInscriptionRepo = createMockInscriptionRepository();
		mockTravelRepo = createMockTravelRepository();
		mockUserRepo = createMockUserRepository();
		container.registerInstance(TOKENS.InscriptionRepository, mockInscriptionRepo);
		container.registerInstance(TOKENS.TravelRepository, mockTravelRepo);
		container.registerInstance(TOKENS.UserRepository, mockUserRepo);
		container.registerInstance(TOKENS.Logger, createMockLogger());
		useCase = container.resolve(CreateInscriptionUseCase);
	});

	// Happy path: user and travel exist, seats available, not already inscribed
	it('should create inscription successfully', async () => {
		const inscription = { id: 'i1', refId: 1, createdAt: new Date(), userRefId: 1, routeRefId: 2, status: 'ACTIVE' };
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteRefId.mockResolvedValue(ok(1));
		mockInscriptionRepo.create.mockResolvedValue(ok(inscription));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) expect(result.value).toEqual(inscription);
		expect(mockInscriptionRepo.create).toHaveBeenCalledWith({ userRefId: 1, routeRefId: 2 });
	});

	// Travel UUID does not exist
	it('should return TravelNotFoundError when route does not exist', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(null));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(TravelNotFoundError);
	});

	// Duplicate guard: user already has an inscription on this travel
	it('should return AlreadyInscribedError when user already inscribed', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(true));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(AlreadyInscribedError);
	});

	// Capacity guard: all seats are taken
	it('should return NoSeatsAvailableError when no seats left', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteRefId.mockResolvedValue(ok(3));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toBeInstanceOf(NoSeatsAvailableError);
	});

	// DB error during travel lookup bubbles up
	it('should propagate error from routeRepository.findById', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	// DB error during duplicate check bubbles up
	it('should propagate error from existsByUserAndRoute', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	// DB error during seat counting bubbles up
	it('should propagate error from countByRouteRefId', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(false));
		mockInscriptionRepo.countByRouteRefId.mockResolvedValue(err(new DatabaseError('db error')));
		const result = await useCase.execute(validInput);
		expect(result.success).toBe(false);
	});

	// Short-circuit: seat check is skipped when already inscribed
	it('should not check seats when already inscribed', async () => {
		mockUserRepo.findById.mockResolvedValue(ok(user));
		mockTravelRepo.findById.mockResolvedValue(ok(route));
		mockInscriptionRepo.existsByUserAndRoute.mockResolvedValue(ok(true));
		await useCase.execute(validInput);
		expect(mockInscriptionRepo.countByRouteRefId).not.toHaveBeenCalled();
	});
});
